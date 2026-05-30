// src/data/categoryFilters.ts
import { FilterGroup } from '../components/CategoryFilters';

export const STEAM_GAME_OPTIONS = [
  'Counter-Strike 2', 'Dota 2', 'Rust', 'PUBG: BATTLEGROUNDS', 'Team Fortress 2', 'Grand Theft Auto V',
  'Apex Legends', 'Dead by Daylight', 'War Thunder', 'Warframe', 'Destiny 2', 'ARK: Survival Evolved',
  'ARK: Survival Ascended', 'DayZ', 'The Forest', 'Sons Of The Forest', 'Valheim', 'Terraria', 'Stardew Valley',
  'Project Zomboid', 'Unturned', "Garry's Mod", 'PAYDAY 2', 'PAYDAY 3', 'Left 4 Dead 2', 'Portal 2',
  'Half-Life 2', 'Euro Truck Simulator 2', 'American Truck Simulator', 'Forza Horizon 4', 'Forza Horizon 5',
  'Assetto Corsa', 'BeamNG.drive', 'Phasmophobia', 'Lethal Company', 'Among Us', 'Palworld', "Baldur's Gate 3",
  'Elden Ring', 'Dark Souls III', 'Sekiro: Shadows Die Twice', 'Cyberpunk 2077', 'The Witcher 3: Wild Hunt',
  'Red Dead Redemption 2', 'Monster Hunter: World', 'Monster Hunter Rise', 'Hogwarts Legacy', "No Man's Sky",
  'Sea of Thieves', 'Rainbow Six Siege', 'Battlefield 1', 'Battlefield V', 'Battlefield 2042', 'EA SPORTS FC 24',
  'EA SPORTS FC 25', 'FIFA 23', 'NBA 2K24', 'NBA 2K25', 'Mortal Kombat 11', 'Mortal Kombat 1', 'TEKKEN 8',
  'Street Fighter 6', 'Hunt: Showdown 1896', 'Squad', 'Insurgency: Sandstorm', 'Ready or Not', 'Escape Simulator',
  'Cities: Skylines', 'Cities: Skylines II', 'RimWorld', 'Factorio', 'Satisfactory', 'Dyson Sphere Program',
  'Hearts of Iron IV', 'Europa Universalis IV', 'Crusader Kings III', 'Stellaris', "Sid Meier's Civilization VI",
  'Total War: WARHAMMER III', 'Mount & Blade II: Bannerlord', 'Football Manager 2024', 'Football Manager 2025',
  'The Sims 4', 'Black Desert', 'Lost Ark', 'New World', 'Path of Exile', 'Path of Exile 2', 'Last Epoch',
  'Diablo IV', 'Hades', 'Hades II', 'Hollow Knight', 'Cuphead', 'Celeste', 'Vampire Survivors', 'Slay the Spire',
  'Balatro', "The Binding of Isaac: Rebirth", "Don't Starve Together", '7 Days to Die', 'Killing Floor 2',
  'Deep Rock Galactic', 'Risk of Rain 2', 'Borderlands 2', 'Borderlands 3', 'Resident Evil 4', 'Resident Evil Village',
  'Dying Light', 'Dying Light 2', 'Metro Exodus', 'Control Ultimate Edition', 'NARAKA: BLADEPOINT', 'MIR4',
  'Wallpaper Engine', 'Aimlabs', '3DMark', 'Soundpad', 'Tabletop Simulator', 'VRChat'
];

export const COUNTRY_OPTIONS = [
  'Россия', 'Украина', 'Беларусь', 'Казахстан', 'Узбекистан', 'Киргизия', 'Армения', 'Азербайджан', 'Грузия',
  'Молдова', 'Турция', 'Польша', 'Германия', 'Франция', 'Италия', 'Испания', 'Великобритания', 'Нидерланды',
  'Швеция', 'Финляндия', 'Норвегия', 'Дания', 'Чехия', 'Словакия', 'Румыния', 'Болгария', 'Литва', 'Латвия',
  'Эстония', 'США', 'Канада', 'Бразилия', 'Аргентина', 'Мексика', 'Китай', 'Япония', 'Южная Корея', 'Индия',
  'Индонезия', 'Филиппины', 'Таиланд', 'Вьетнам', 'Австралия', 'Новая Зеландия', 'Египет', 'ОАЭ', 'Саудовская Аравия'
];

export const ACCOUNT_ORIGIN_OPTIONS = [
  'личный',
  'семейный аккаунт',
  'фишинг',
  'стиллер',
  'брут',
  'перепродажа',
  'авторег',
  'пустышка',
  'фарм',
  'восстановлен через поддержку'
];

export const MAIL_ACCESS_OPTIONS = ['родная', 'авторег', 'временная', 'полный доступ', 'без доступа'];
export const MAIL_DOMAIN_OPTIONS = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'mail.ru', 'bk.ru', 'inbox.ru', 'list.ru', 'yandex.ru', 'rambler.ru', 'proton.me', 'protonmail.com', 'gmx.com', 'aol.com', 'другой'];

export const CATEGORY_FILTERS: Record<string, FilterGroup[]> = {
  // ====================== STEAM ======================
  steam: [
    {
      title: 'АККАУНТ',
      fields: [
        { type: 'select', key: 'game_no_vac',  label: 'Выберите игру без VAC бана', options: STEAM_GAME_OPTIONS },
        { type: 'select', key: 'origin',          label: 'Происхождение аккаунта', options: ACCOUNT_ORIGIN_OPTIONS },
        { type: 'select', key: 'exclude_origin',  label: 'Исключить происхождение', options: ACCOUNT_ORIGIN_OPTIONS },
        { type: 'select', key: 'mail_access',     label: 'Доступ к почте', options: MAIL_ACCESS_OPTIONS },
        { type: 'select', key: 'mail_domain',     label: 'Почтовый домен', options: MAIL_DOMAIN_OPTIONS },
        { type: 'select', key: 'exclude_mail_domain', label: 'Исключить почтовый домен', options: MAIL_DOMAIN_OPTIONS },
        { type: 'check',  key: 'filter_by_date',  label: 'Фильтровать по дате публикации' },
        { type: 'check',  key: 'sold_never',      label: 'Не продавался ранее' },
        { type: 'check',  key: 'sold_before',     label: 'Продавался ранее' },
        { type: 'check',  key: 'sold_never_me',   label: 'Не продавался ранее мною' },
        { type: 'check',  key: 'sold_me',         label: 'Продавался ранее мною' },
        { type: 'range',  key: 'points',          label: 'Очков от / до' },
        { type: 'range',  key: 'level',           label: 'Уровень от / до' },
        { type: 'range',  key: 'friends',         label: 'Друзей от / до' },
        { type: 'range',  key: 'games',           label: 'Игр от / до' },
        { type: 'range',  key: 'actual_games',    label: 'Актуальных игр от / до' },
      ],
    },
    {
      title: 'РЕГИОН И АКТИВНОСТЬ',
      fields: [
        { type: 'select', key: 'country',         label: 'Страна', options: COUNTRY_OPTIONS },
        { type: 'select', key: 'exclude_country', label: 'Исключить страну', options: COUNTRY_OPTIONS },
        { type: 'range',  key: 'offload_days',    label: 'Отлёжка от, дней' },
        { type: 'number', key: 'guarantee_hours', label: 'Длительность гарантии (часов)' },
        { type: 'number', key: 'last_tx_more',    label: 'Последняя транзакция больше (лет назад)' },
        { type: 'number', key: 'last_tx_less',    label: 'Последняя транзакция не позднее (лет назад)' },
        { type: 'check',  key: 'no_transactions', label: 'Без транзакций' },
        { type: 'check',  key: 'with_transactions', label: 'С транзакциями' },
        { type: 'range',  key: 'gifts_amount',    label: 'Гифты ₽ от / до' },
        { type: 'range',  key: 'returns_amount',  label: 'Возвраты ₽ от / до' },
        { type: 'range',  key: 'ingame_purchases', label: 'Внутриигровых покупок ₽' },
        { type: 'range',  key: 'total_games_cost', label: 'Общая сумма игр ₽' },
        { type: 'range',  key: 'purchases_sum',    label: 'Сумма покупок ₽' },
      ],
    },
    {
      title: 'БАЛАНС И ИНВЕНТАРЬ',
      fields: [
        { type: 'range',  key: 'balance_hold',     label: 'Баланс на удержании ₽' },
        { type: 'select', key: 'inv_game',         label: 'Игра для инвентаря', options: STEAM_GAME_OPTIONS },
        { type: 'range',  key: 'inventory_cost',   label: 'Стоимость инвентаря ₽' },
        { type: 'check',  key: 'ignore_if_ban',    label: 'Игнорировать, если бан у этой игры' },
        { type: 'range',  key: 'balance',          label: 'Баланс ₽ от / до' },
        { type: 'number', key: 'reg_earlier',      label: 'Регистрация ранее (лет назад)' },
        { type: 'number', key: 'reg_later',        label: 'Регистрация позже (лет назад)' },
      ],
    },
    {
      title: 'STEAM · ОГРАНИЧЕНИЯ',
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
      title: 'КАРТОЧКИ И КЛЮЧИ',
      fields: [
        { type: 'range', key: 'cards_available',  label: 'Доступные к получению карточки' },
        { type: 'range', key: 'games_with_cards', label: 'Игры с доступными карточками' },
        { type: 'radio', key: 'has_keys',         label: 'Есть активированные ключи' },
        { type: 'select', key: 'vac_ban_in',       label: 'Наличие VAC бана в', options: STEAM_GAME_OPTIONS },
        { type: 'check', key: 'no_check_game',    label: 'Не проверять наличие игры' },
        { type: 'check', key: 'no_vac_all',       label: 'Без VAC во всех играх' },
        { type: 'range', key: 'hours_2weeks',     label: 'Сыграно за 2 недели (часов)' },
      ],
    },
    {
      title: 'CS2',
      fields: [
        { type: 'range',  key: 'cs2_wins',         label: 'Побед от / до' },
        { type: 'range',  key: 'cs2_premier_elo',  label: 'Премьер ELO' },
        { type: 'select', key: 'cs2_ranks_mm',     label: 'CS2 Ранги в ММ', options: ['Карта 1', 'Карта 2', 'Карта 3', 'Карта 4'] },
        { type: 'range',  key: 'cs2_partners',     label: 'Напарники (2x2)' },
        { type: 'range',  key: 'cs2_private_rank', label: 'Приватный ранг CS2 от 1 до 40' },
        { type: 'range',  key: 'cs2_medals',       label: 'Медалей от 1' },
        { type: 'text',   key: 'cs2_medals_list',  label: 'CS2 Медали' },
        { type: 'check',  key: 'cs2_medals_or',    label: 'Искать медали через "ИЛИ" вместо "И"' },
        { type: 'range',  key: 'faceit_lvl',       label: 'FACEIT уровень от 1 до 10' },
        { type: 'radio',  key: 'faceit_linked',    label: 'Привязан FACEIT' },
        { type: 'radio',  key: 'cs2_mm_ban',       label: 'Бан в матчмейкинге CS2' },
      ],
    },
    {
      title: 'DOTA 2',
      fields: [
        { type: 'range',  key: 'dota_mmr',       label: 'MMR от / до' },
        { type: 'range',  key: 'dota_matches',   label: 'Матчей от / до' },
        { type: 'range',  key: 'dota_wins',      label: 'Побед от / до' },
        { type: 'range',  key: 'dota_behavior',  label: 'Порядочность от 1 до 12 000' },
        { type: 'number', key: 'dota_last_more', label: 'Последняя игра больше (лет назад)' },
        { type: 'number', key: 'dota_last_less', label: 'Последняя игра меньше (лет назад)' },
      ],
    },
    {
      title: 'RUST',
      fields: [
        { type: 'range', key: 'rust_deaths', label: 'Смертей от / до' },
        { type: 'range', key: 'rust_kills',  label: 'Убийств от / до' },
      ],
    },
    {
      title: 'СВОЯ ИГРА',
      fields: [
        { type: 'text',   key: 'custom_game_name', label: 'Название игры' },
        { type: 'text',   key: 'custom_stat_1',    label: 'Параметр 1 (например MMR)' },
        { type: 'range',  key: 'custom_stat_1_val', label: 'Значение от / до' },
        { type: 'text',   key: 'custom_stat_2',    label: 'Параметр 2 (например побед)' },
        { type: 'range',  key: 'custom_stat_2_val', label: 'Значение от / до' },
        { type: 'number', key: 'custom_hours',     label: 'Часов в игре от' },
      ],
    },
    {
      title: 'ГИФТЫ',
      fields: [
        { type: 'text',  key: 'gift_choose', label: 'Выберите гифт' },
        { type: 'range', key: 'gifts_count', label: 'Гифтов от / до' },
      ],
    },
  ],

  // ====================== TELEGRAM ======================
  telegram: [
    {
      title: 'АККАУНТ',
      fields: [
        { type: 'select', key: 'origin',          label: 'Происхождение аккаунта', options: ACCOUNT_ORIGIN_OPTIONS },
        { type: 'select', key: 'exclude_origin',  label: 'Исключить происхождение', options: ACCOUNT_ORIGIN_OPTIONS },
        { type: 'range',  key: 'channels',        label: 'Каналов от / до' },
        { type: 'range',  key: 'groups',          label: 'Групповых чатов' },
        { type: 'range',  key: 'dialogs',         label: 'Переписок от / до' },
        { type: 'range',  key: 'admin_chats',     label: 'Админ. чатов' },
        { type: 'range',  key: 'subs_in_chats',   label: 'Количество подписчиков в чатах' },
        { type: 'check',  key: 'filter_by_date',  label: 'Фильтровать по дате публикации' },
        { type: 'check',  key: 'sold_never',      label: 'Не продавался ранее' },
        { type: 'check',  key: 'sold_before',     label: 'Продавался ранее' },
        { type: 'check',  key: 'sold_never_me',   label: 'Не продавался ранее мною' },
        { type: 'check',  key: 'sold_me',         label: 'Продавался ранее мною' },
      ],
    },
    {
      title: 'РЕГИОН И DC',
      fields: [
        { type: 'select', key: 'country',         label: 'Страна', options: COUNTRY_OPTIONS },
        { type: 'select', key: 'exclude_country', label: 'Исключить страну', options: COUNTRY_OPTIONS },
        { type: 'text',   key: 'dc_id',           label: 'DC ID' },
        { type: 'text',   key: 'exclude_dc',      label: 'Исключить DC ID' },
        { type: 'range',  key: 'offload_days',    label: 'Отлёжка от, дней' },
      ],
    },
    {
      title: 'TELEGRAM PREMIUM',
      fields: [
        { type: 'radio',  key: 'premium',         label: 'Premium' },
        { type: 'number', key: 'premium_more',    label: 'Срок действия больше (дней)' },
      ],
    },
    {
      title: 'СТАТИСТИКА',
      fields: [
        { type: 'range',  key: 'rating',          label: 'Уровень рейтинга' },
        { type: 'range',  key: 'id_digits',       label: 'Количество цифр у ID' },
        { type: 'range',  key: 'telegram_id',     label: 'Telegram ID' },
        { type: 'range',  key: 'contacts',        label: 'Количество контактов' },
        { type: 'range',  key: 'telegram_stars',  label: 'Telegram Stars' },
      ],
    },
    {
      title: 'ВОЗРАСТ ВЛАДЕЛЬЦА',
      fields: [
        { type: 'number', key: 'age_from',  label: 'От X (дней)' },
        { type: 'number', key: 'age_to',    label: 'До X (дней)' },
      ],
    },
    {
      title: 'БЕЗОПАСНОСТЬ',
      fields: [
        { type: 'radio',  key: 'has_password',    label: 'Пароль на аккаунте' },
        { type: 'radio',  key: 'mail_linked',     label: 'Привязанная почта' },
        { type: 'radio',  key: 'spam_block',      label: 'Спамблок' },
        { type: 'check',  key: 'allow_geo_spam',  label: 'Разрешить ГЕО спамблок' },
      ],
    },
    {
      title: 'ПОДАРКИ',
      fields: [
        { type: 'range',  key: 'gifts',           label: 'Подарки от / до' },
        { type: 'range',  key: 'nft_gifts',       label: 'NFT подарки' },
        { type: 'range',  key: 'gifts_cost',      label: 'Стоимость всех подарков' },
        { type: 'range',  key: 'gifts_stars',     label: 'Стоимость после конвертации в Stars' },
      ],
    },
    {
      title: 'БОТЫ',
      fields: [
        { type: 'range',  key: 'bots_created',    label: 'Созданные боты' },
        { type: 'range',  key: 'active_users',    label: 'Активных пользователей' },
      ],
    },
  ],
};
