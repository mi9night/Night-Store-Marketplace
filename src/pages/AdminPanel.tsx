import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Shield, MessageSquare, Check, X } from 'lucide-react';

const AdminPanel: React.FC = () => {

  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  /* ================= LOAD TICKETS ================= */

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  const loadTickets = async () => {

    let query = supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;
    if (data) setTickets(data);
  };

  /* ================= OPEN TICKET ================= */

  const openTicket = async (ticket: any) => {

    setSelectedTicket(ticket);

    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  /* ================= SEND MESSAGE ================= */

  const sendMessage = async () => {

    if (!newMessage.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('ticket_messages').insert({
      ticket_id: selectedTicket.id,
      sender_id: user.id,
      message: newMessage
    });

    await supabase.from('moderation_logs').insert({
      moderator_id: user.id,
      action: 'reply_ticket',
      target_type: 'ticket',
      target_id: selectedTicket.id
    });

    setNewMessage('');
    openTicket(selectedTicket);
  };

  /* ================= CHANGE STATUS ================= */

  const changeStatus = async (status: string) => {

    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from('tickets')
      .update({ status })
      .eq('id', selectedTicket.id);

    await supabase.from('moderation_logs').insert({
      moderator_id: user?.id,
      action: `ticket_${status}`,
      target_type: 'ticket',
      target_id: selectedTicket.id
    });

    openTicket({ ...selectedTicket, status });
    loadTickets();
  };

  return (
    <div className="flex h-[80vh] gap-6">

      {/* LEFT: TICKET LIST */}
      <div className="w-1/3 bg-bg-card border border-purple-900/20 rounded-xl p-4 overflow-y-auto">

        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-accent" />
          <h2 className="text-white font-semibold">Жалобы</h2>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-4">
          {['all','open','in_progress','resolved','rejected'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs ${
                statusFilter === s
                  ? 'bg-accent text-white'
                  : 'bg-purple-900/20 text-text-secondary'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {tickets.map(ticket => (
          <motion.div
            key={ticket.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => openTicket(ticket)}
            className={`p-3 rounded-lg cursor-pointer mb-2 border ${
              selectedTicket?.id === ticket.id
                ? 'border-accent bg-purple-900/20'
                : 'border-purple-900/10'
            }`}
          >
            <p className="text-white text-sm font-medium">
              {ticket.category}
            </p>
            <p className="text-xs text-text-secondary">
              Статус: {ticket.status}
            </p>
          </motion.div>
        ))}

      </div>

      {/* RIGHT: TICKET VIEW */}
      <div className="flex-1 bg-bg-card border border-purple-900/20 rounded-xl p-4 flex flex-col">

        {!selectedTicket && (
          <div className="flex items-center justify-center h-full text-text-secondary">
            Выберите тикет
          </div>
        )}

        {selectedTicket && (
          <>
            <div className="mb-4">
              <h3 className="text-white font-semibold">
                {selectedTicket.category}
              </h3>
              <p className="text-xs text-text-secondary">
                Статус: {selectedTicket.status}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
              {messages.map(m => (
                <div
                  key={m.id}
                  className="bg-purple-900/10 p-2 rounded-lg text-sm"
                >
                  {m.message}
                </div>
              ))}
            </div>

            {/* New message */}
            <div className="flex gap-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ответить..."
                className="flex-1 p-2 rounded-lg bg-purple-900/10 text-white"
              />
              <button
                onClick={sendMessage}
                className="px-3 py-2 bg-accent rounded-lg text-white"
              >
                <MessageSquare size={14} />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => changeStatus('resolved')}
                className="flex items-center gap-1 px-3 py-1 bg-success rounded-lg text-white text-xs"
              >
                <Check size={14} /> Решено
              </button>

              <button
                onClick={() => changeStatus('rejected')}
                className="flex items-center gap-1 px-3 py-1 bg-error rounded-lg text-white text-xs"
              >
                <X size={14} /> Отклонить
              </button>

              <button
                onClick={() => changeStatus('in_progress')}
                className="px-3 py-1 bg-purple-600 rounded-lg text-white text-xs"
              >
                В процессе
              </button>
            </div>

          </>
        )}

      </div>

    </div>
  );
};

export default AdminPanel;