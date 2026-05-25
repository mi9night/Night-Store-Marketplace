// src/data/categoryFilters.ts
import { FilterGroup } from '../components/CategoryFilters';

export const CATEGORY_FILTERS: Record<string, FilterGroup[]> = {
  // ====================== STEAM ======================
  steam: [
    {
      title: '🎮 Профиль',
      fields: [
        { type: 'text',  key: 'origin',      label: 'Происхождение аккаунта' },
        { type: 'text',  key: 'exclude_origin', label: 'Исключить происхождение' },
        { type: 'text',  key: 'country',     label: 'Страна' },
        { type: 'text',  key: 'exclude_country', label: 'Исключить страну' },
        { type: 'text',  key: 'mail_access', label: 'Доступ к почте' },
        { type: 'text',  key: 'mail_domain', label: 'Почтовый домен' },
        { type: 'text',  key: 'exclude_mail_domain', label: 'Исключить почтовый домен' },
        { type: 'text',  key: 'mail_service', label: 'Почтовый сервис' },
        { type: 'text',  key: 'exclude_mail_service', label: 'Исключить почтовый сервис' },
        { type: 'range', key: 'offload_days', label: 'Отлёжка от, дней' },
        { type: 'number', key: 'guarantee_hours', label: 'Длительность гарантии (ч)' },
      ],
    },
    {
      title: '📊 Статистика',
      fields: [
        { type: 'range', key: 'points',    label: 'Очков' },
        { type: 'range', key: 'level',     label: 'Уровень' },
        { type: 'range', key: 'friends',   label: 'Друзей' },
        { type: 'range', key: 'games',     label: 'Игр' },
        { type: 'range', key: 'actual_games', label: 'Актуальных игр' },
      ],
    },
    {
      title: '💰 Финансы',
      fields: [
        { type: 'range', key: 'balance_hold', label: 'Баланс на удержании', suffix: '₽' },
        { type: 'range', key: 'balance',      label: 'Баланс',              suffix: '₽' },
        { type: 'range', key: 'inventory_cost', label: 'Стоимость инвентаря', suffix: '₽' },
        { type: 'check', key: 'ignore_if_ban', label: 'Игнорировать, если есть бан у этой игры' },
        { type: 'range', key: 'gifts_amount',  label: 'Гифты',    suffix: '₽' },
        { type: 'range', key: 'returns_amount', label: 'Возвраты', suffix: '₽' },
        { type: 'range', key: 'ingame_purchases', label: 'Внутриигровых покупок', suffix: '₽' },
        { type: 'range', key: 'total_games_cost', label: 'Общая сумма игр',     suffix: '₽' },
        { type: 'range', key: 'purchases_sum',    label: 'Сумма покупок',       suffix: '₽' },
      ],
    },
    {
      title: '📅 Транзакции',
      fields: [
        { type: 'number', key: 'last_tx_more', label: 'Последняя транзакция больше (лет)' },
        { type: 'number', key: 'last_tx_less', label: 'Последняя транзакция не позднее (лет)' },
        { type: 'check', key: 'no_transactions', label: 'Без транзакций' },
        { type: 'check', key: 'with_transactions', label: 'С транзакциями' },
      ],
    },
    {
      title: '🗓 Регистрация',
      fields: [
        { type: 'number', key: 'reg_earlier', label: 'Регистрация ранее (лет назад)' },
        { type: 'number', key: 'reg_later',   label: 'Регистрация позже (лет назад)' },
      ],
    },
    {
      title: '🔫 CS2',
      fields: [
        { type: 'range', key: 'cs2_wins',         label: 'Побед в CS2' },
        { type: 'range', key: 'cs2_premier_elo',  label: 'Премьер ELO' },
        { type: 'select', key: 'cs2_ranks_mm',    label: 'CS2 Ранги в ММ', options: ['Карта 1', 'Карта 2', 'Карта 3'] },
        { type: 'range', key: 'cs2_partners',     label: 'Напарники (2x2)' },
        { type: 'range', key: 'cs2_private_rank', label: 'Приватный ранг CS2' },
        { type: 'range', key: 'cs2_medals',       label: 'Медалей' },
        { type: 'text',  key: 'cs2_medals_list',  label: 'CS2 Медали' },
        { type: 'check', key: 'cs2_medals_or',    label: 'Искать медали через "ИЛИ" вместо "И"' },
        { type: 'range', key: 'faceit_lvl',       label: 'FACEIT уровень' },
        { type: 'radio', key: 'faceit_linked',    label: 'Привязан FACEIT' },
        { type: 'radio', key: 'cs2_mm_ban',       label: 'Бан в матчмейкинге CS2' },
      ],
    },
    {
      title: '⚔️ Dota 2',
      fields: [
        { type: 'range', key: 'dota_mmr',     label: 'MMR' },
        { type: 'range', key: 'dota_matches', label: 'Матчей' },
        { type: 'range', key: 'dota_wins',    label: 'Побед' },
        { type: 'range', key: 'dota_behavior', label: 'Порядочность' },
        { type: 'number', key: 'dota_last_more', label: 'Последняя игра больше (лет назад)' },
        { type: 'number', key: 'dota_last_less', label: 'Последняя игра меньше (лет назад)' },
      ],
    },
    {
      title: '🔫 Rust',
      fields: [
        { type: 'range', key: 'rust_deaths', label: 'Смерти' },
        { type: 'range', key: 'rust_kills',  label: 'Убийства' },
      ],
    },
    {
      title: '🛒 Карточки и инвентарь',
      fields: [
        { type: 'range', key: 'cards_available',   label: 'Доступные к получению карточки' },
        { type: 'range', key: 'games_with_cards',  label: 'Игры с доступными карточками' },
        { type: 'radio', key: 'has_keys',          label: 'Есть активированные ключи' },
        { type: 'text',  key: 'vac_ban_in',        label: 'Наличие VAC бана в' },
        { type: 'check', key: 'no_check_game',     label: 'Не проверять наличие игры' },
        { type: 'check', key: 'no_vac_all',        label: 'Без VAC во всех играх' },
        { type: 'range', key: 'hours_2weeks',      label: 'Сыграно за 2 недели (часов)' },
      ],
    },
    {
      title: '🎁 Гифты',
      fields: [
        { type: 'text',  key: 'gift_choose', label: 'Выберите гифт' },
        { type: 'range', key: 'gifts_count', label: 'Гифтов' },
      ],
    },
    {
      title: '🔒 Безопасность',
      fields: [
        { type: 'radio', key: 'sda_mafile',    label: 'SDA (.maFile)' },
        { type: 'radio', key: 'limit_5usd',    label: 'Наличие лимита (5$)' },
        { type: 'radio', key: 'red_plate',     label: 'Красная табличка' },
        { type: 'radio', key: 'trade_ban',     label: 'Trade Ban' },
        { type: 'radio', key: 'trade_limit',   label: 'Trade Limit' },
        { type: 'radio', key: 'market_access', label: 'Market' },
      ],
    },
    {
      title: '📌 Прочее',
      fields: [
        { type: 'range', key: 'price', label: 'Цена', suffix: '₽' },
        { type: 'check', key: 'sold_never',     label: 'Не продавался ранее' },
        { type: 'check', key: 'sold_before',    label: 'Продавался ранее' },
        { type: 'check', key: 'sold_never_me',  label: 'Не продавался ранее мною' },
        { type: 'check', key: 'sold_me',        label: 'Продавался ранее мною' },
        { type: 'check', key: 'filter_by_date', label: 'Фильтровать по дате публикации' },
      ],
    },
  ],

  // ====================== TELEGRAM ======================
  telegram: [
    {
      title: '🔍 Поиск',
      fields: [
        { type: 'range', key: 'price',          label: 'Цена', suffix: '₽' },
        { type: 'text',  key: 'search_title',   label: 'Поиск по заголовку, Telegram ID' },
        { type: 'text',  key: 'origin',         label: 'Происхождение аккаунта' },
        { type: 'text',  key: 'exclude_origin', label: 'Исключить происхождение' },
        { type: 'text',  key: 'country',        label: 'Страна' },
        { type: 'text',  key: 'exclude_country', label: 'Исключить страну' },
        { type: 'text',  key: 'dc_id',          label: 'DC ID' },
        { type: 'text',  key: 'exclude_dc',     label: 'Исключить DC ID' },
        { type: 'range', key: 'offload_days',   label: 'Отлёжка от, дней' },
      ],
    },
    {
      title: '🔐 Безопасность',
      fields: [
        { type: 'radio', key: 'has_password',   label: 'Пароль на аккаунте' },
        { type: 'radio', key: 'mail_linked',    label: 'Привязанная почта' },
        { type: 'radio', key: 'spam_block',     label: 'Спамблок' },
        { type: 'check', key: 'allow_geo_spam', label: 'Разрешить ГЕО спамблок' },
      ],
    },
    {
      title: '⭐ Telegram Premium',
      fields: [
        { type: 'radio',  key: 'premium',        label: 'Telegram Premium' },
        { type: 'number', key: 'premium_more',   label: 'Срок действия больше (дней)' },
      ],
    },
    {
      title: '💬 Чаты',
      fields: [
        { type: 'range', key: 'channels',     label: 'Каналов' },
        { type: 'range', key: 'groups',       label: 'Групповых чатов' },
        { type: 'range', key: 'dialogs',      label: 'Переписок' },
        { type: 'range', key: 'admin_chats',  label: 'Админ. чатов' },
        { type: 'range', key: 'subs_in_chats', label: 'Количество подписчиков в чатах' },
      ],
    },
    {
      title: '📊 Статистика',
      fields: [
        { type: 'range', key: 'rating',       label: 'Уровень рейтинга' },
        { type: 'range', key: 'id_digits',    label: 'Количество цифр у ID' },
        { type: 'range', key: 'telegram_id',  label: 'Telegram ID' },
        { type: 'range', key: 'contacts',     label: 'Количество контактов' },
        { type: 'range', key: 'telegram_stars', label: 'Telegram Stars' },
      ],
    },
    {
      title: '👤 Возраст владельца',
      fields: [
        { type: 'number', key: 'age_from',  label: 'От X (дней)' },
        { type: 'number', key: 'age_to',    label: 'До X (дней)' },
      ],
    },
    {
      title: '🎁 Подарки',
      fields: [
        { type: 'range', key: 'gifts',          label: 'Подарки' },
        { type: 'range', key: 'nft_gifts',      label: 'NFT подарки' },
        { type: 'range', key: 'gifts_cost',     label: 'Стоимость всех подарков' },
        { type: 'range', key: 'gifts_stars',    label: 'Стоимость после конвертации в Stars' },
      ],
    },
    {
      title: '🤖 Боты',
      fields: [
        { type: 'range', key: 'bots_created', label: 'Созданные боты' },
        { type: 'range', key: 'active_users', label: 'Активных пользователей' },
      ],
    },
    {
      title: '📌 Прочее',
      fields: [
        { type: 'check', key: 'filter_by_date',  label: 'Фильтровать по дате публикации' },
        { type: 'check', key: 'sold_never',      label: 'Не продавался ранее' },
        { type: 'check', key: 'sold_before',     label: 'Продавался ранее' },
        { type: 'check', key: 'sold_never_me',   label: 'Не продавался ранее мною' },
        { type: 'check', key: 'sold_me',         label: 'Продавался ранее мною' },
      ],
    },
  ],
};
