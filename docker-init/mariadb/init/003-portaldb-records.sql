USE portaldb;

INSERT IGNORE INTO organizations (
  organization_code,
  organization_name,
  status
) VALUES (
  'owner',
  'Owner',
  'ACTIVE'
);

INSERT IGNORE INTO system_codes (
  system_code,
  description,
  status
) VALUES (
  'CurrencyCode',
  'Active ISO 4217 Currency Code',
  'ACTIVE'
);

INSERT IGNORE INTO system_code_values (
  system_code_id,
  system_code_value,
  description,
  status,
  sort_order
)
SELECT
  system_code.id,
  seed.system_code_value,
  seed.description,
  'ACTIVE',
  seed.sort_order
FROM (
  SELECT 'AED' AS system_code_value, 'United Arab Emirates Dirham' AS description, 1 AS sort_order
  UNION ALL SELECT 'AFN', 'Afghan Afghani', 2
  UNION ALL SELECT 'ALL', 'Albanian Lek', 3
  UNION ALL SELECT 'AMD', 'Armenian Dram', 4
  UNION ALL SELECT 'ANG', 'Netherlands Antillean Guilder', 5
  UNION ALL SELECT 'AOA', 'Angolan Kwanza', 6
  UNION ALL SELECT 'ARS', 'Argentine Peso', 7
  UNION ALL SELECT 'AUD', 'Australian Dollar', 8
  UNION ALL SELECT 'AWG', 'Aruban Florin', 9
  UNION ALL SELECT 'AZN', 'Azerbaijani Manat', 10
  UNION ALL SELECT 'BAM', 'Bosnia-Herzegovina Convertible Mark', 11
  UNION ALL SELECT 'BBD', 'Barbadian Dollar', 12
  UNION ALL SELECT 'BDT', 'Bangladeshi Taka', 13
  UNION ALL SELECT 'BGN', 'Bulgarian Lev', 14
  UNION ALL SELECT 'BHD', 'Bahraini Dinar', 15
  UNION ALL SELECT 'BIF', 'Burundian Franc', 16
  UNION ALL SELECT 'BMD', 'Bermudian Dollar', 17
  UNION ALL SELECT 'BND', 'Brunei Dollar', 18
  UNION ALL SELECT 'BOB', 'Bolivian Boliviano', 19
  UNION ALL SELECT 'BRL', 'Brazilian Real', 20
  UNION ALL SELECT 'BSD', 'Bahamian Dollar', 21
  UNION ALL SELECT 'BTN', 'Bhutanese Ngultrum', 22
  UNION ALL SELECT 'BWP', 'Botswanan Pula', 23
  UNION ALL SELECT 'BYN', 'Belarusian Ruble', 24
  UNION ALL SELECT 'BZD', 'Belize Dollar', 25
  UNION ALL SELECT 'CAD', 'Canadian Dollar', 26
  UNION ALL SELECT 'CDF', 'Congolese Franc', 27
  UNION ALL SELECT 'CHF', 'Swiss Franc', 28
  UNION ALL SELECT 'CLP', 'Chilean Peso', 29
  UNION ALL SELECT 'CNY', 'Chinese Yuan', 30
  UNION ALL SELECT 'COP', 'Colombian Peso', 31
  UNION ALL SELECT 'CRC', 'Costa Rican Colon', 32
  UNION ALL SELECT 'CUP', 'Cuban Peso', 33
  UNION ALL SELECT 'CVE', 'Cape Verdean Escudo', 34
  UNION ALL SELECT 'CZK', 'Czech Republic Koruna', 35
  UNION ALL SELECT 'DJF', 'Djiboutian Franc', 36
  UNION ALL SELECT 'DKK', 'Danish Krone', 37
  UNION ALL SELECT 'DOP', 'Dominican Peso', 38
  UNION ALL SELECT 'DZD', 'Algerian Dinar', 39
  UNION ALL SELECT 'EGP', 'Egyptian Pound', 40
  UNION ALL SELECT 'ERN', 'Eritrean Nakfa', 41
  UNION ALL SELECT 'ETB', 'Ethiopian Birr', 42
  UNION ALL SELECT 'EUR', 'Euro', 43
  UNION ALL SELECT 'FJD', 'Fijian Dollar', 44
  UNION ALL SELECT 'FKP', 'Falkland Islands Pound', 45
  UNION ALL SELECT 'GBP', 'British Pound Sterling', 46
  UNION ALL SELECT 'GEL', 'Georgian Lari', 47
  UNION ALL SELECT 'GHS', 'Ghanaian Cedi', 48
  UNION ALL SELECT 'GIP', 'Gibraltar Pound', 49
  UNION ALL SELECT 'GMD', 'Gambian Dalasi', 50
  UNION ALL SELECT 'GNF', 'Guinean Franc', 51
  UNION ALL SELECT 'GTQ', 'Guatemalan Quetzal', 52
  UNION ALL SELECT 'GYD', 'Guyanaese Dollar', 53
  UNION ALL SELECT 'HKD', 'Hong Kong Dollar', 54
  UNION ALL SELECT 'HNL', 'Honduran Lempira', 55
  UNION ALL SELECT 'HRK', 'Croatian Kuna', 56
  UNION ALL SELECT 'HTG', 'Haitian Gourde', 57
  UNION ALL SELECT 'HUF', 'Hungarian Forint', 58
  UNION ALL SELECT 'IDR', 'Indonesian Rupiah', 59
  UNION ALL SELECT 'ILS', 'Israeli New Shekel', 60
  UNION ALL SELECT 'INR', 'Indian Rupee', 61
  UNION ALL SELECT 'IQD', 'Iraqi Dinar', 62
  UNION ALL SELECT 'IRR', 'Iranian Rial', 63
  UNION ALL SELECT 'ISK', 'Icelandic Krona', 64
  UNION ALL SELECT 'JMD', 'Jamaican Dollar', 65
  UNION ALL SELECT 'JOD', 'Jordanian Dinar', 66
  UNION ALL SELECT 'JPY', 'Japanese Yen', 67
  UNION ALL SELECT 'KES', 'Kenyan Shilling', 68
  UNION ALL SELECT 'KGS', 'Kyrgystani Som', 69
  UNION ALL SELECT 'KHR', 'Cambodian Riel', 70
  UNION ALL SELECT 'KMF', 'Comorian Franc', 71
  UNION ALL SELECT 'KPW', 'North Korean Won', 72
  UNION ALL SELECT 'KRW', 'South Korean Won', 73
  UNION ALL SELECT 'KWD', 'Kuwaiti Dinar', 74
  UNION ALL SELECT 'KYD', 'Cayman Islands Dollar', 75
  UNION ALL SELECT 'KZT', 'Kazakhstani Tenge', 76
  UNION ALL SELECT 'LAK', 'Laotian Kip', 77
  UNION ALL SELECT 'LBP', 'Lebanese Pound', 78
  UNION ALL SELECT 'LKR', 'Sri Lankan Rupee', 79
  UNION ALL SELECT 'LRD', 'Liberian Dollar', 80
  UNION ALL SELECT 'LSL', 'Lesotho Loti', 81
  UNION ALL SELECT 'LYD', 'Libyan Dinar', 82
  UNION ALL SELECT 'MAD', 'Moroccan Dirham', 83
  UNION ALL SELECT 'MDL', 'Moldovan Leu', 84
  UNION ALL SELECT 'MGA', 'Malagasy Ariary', 85
  UNION ALL SELECT 'MKD', 'Macedonian Denar', 86
  UNION ALL SELECT 'MMK', 'Myanma Kyat', 87
  UNION ALL SELECT 'MNT', 'Mongolian Tugrik', 88
  UNION ALL SELECT 'MOP', 'Macanese Pataca', 89
  UNION ALL SELECT 'MRU', 'Mauritanian Ouguiya', 90
  UNION ALL SELECT 'MUR', 'Mauritian Rupee', 91
  UNION ALL SELECT 'MVR', 'Maldivian Rufiyaa', 92
  UNION ALL SELECT 'MWK', 'Malawian Kwacha', 93
  UNION ALL SELECT 'MXN', 'Mexican Peso', 94
  UNION ALL SELECT 'MYR', 'Malaysian Ringgit', 95
  UNION ALL SELECT 'MZN', 'Mozambican Metical', 96
  UNION ALL SELECT 'NAD', 'Namibian Dollar', 97
  UNION ALL SELECT 'NGN', 'Nigerian Naira', 98
  UNION ALL SELECT 'NIO', 'Nicaraguan Cordoba', 99
  UNION ALL SELECT 'NOK', 'Norwegian Krone', 100
  UNION ALL SELECT 'NPR', 'Nepalese Rupee', 101
  UNION ALL SELECT 'NZD', 'New Zealand Dollar', 102
  UNION ALL SELECT 'OMR', 'Omani Rial', 103
  UNION ALL SELECT 'PAB', 'Panamanian Balboa', 104
  UNION ALL SELECT 'PEN', 'Peruvian Sol', 105
  UNION ALL SELECT 'PGK', 'Papua New Guinean Kina', 106
  UNION ALL SELECT 'PHP', 'Philippine Peso', 107
  UNION ALL SELECT 'PKR', 'Pakistani Rupee', 108
  UNION ALL SELECT 'PLN', 'Polish Zloty', 109
  UNION ALL SELECT 'PYG', 'Paraguayan Guarani', 110
  UNION ALL SELECT 'QAR', 'Qatari Rial', 111
  UNION ALL SELECT 'RON', 'Romanian Leu', 112
  UNION ALL SELECT 'RSD', 'Serbian Dinar', 113
  UNION ALL SELECT 'RUB', 'Russian Ruble', 114
  UNION ALL SELECT 'RWF', 'Rwandan Franc', 115
  UNION ALL SELECT 'SAR', 'Saudi Riyal', 116
  UNION ALL SELECT 'SBD', 'Solomon Islands Dollar', 117
  UNION ALL SELECT 'SCR', 'Seychellois Rupee', 118
  UNION ALL SELECT 'SDG', 'Sudanese Pound', 119
  UNION ALL SELECT 'SEK', 'Swedish Krona', 120
  UNION ALL SELECT 'SGD', 'Singapore Dollar', 121
  UNION ALL SELECT 'SHP', 'Saint Helena Pound', 122
  UNION ALL SELECT 'SLE', 'Sierra Leonean Leone', 123
  UNION ALL SELECT 'SLL', 'Sierra Leonean Leone', 124
  UNION ALL SELECT 'SOS', 'Somali Shilling', 125
  UNION ALL SELECT 'SRD', 'Surinamese Dollar', 126
  UNION ALL SELECT 'SSP', 'South Sudanese Pound', 127
  UNION ALL SELECT 'STN', 'Sao Tome and Principe Dobra', 128
  UNION ALL SELECT 'SVC', 'Salvadoran Colon', 129
  UNION ALL SELECT 'SYP', 'Syrian Pound', 130
  UNION ALL SELECT 'SZL', 'Swazi Lilangeni', 131
  UNION ALL SELECT 'THB', 'Thai Baht', 132
  UNION ALL SELECT 'TJS', 'Tajikistani Somoni', 133
  UNION ALL SELECT 'TMT', 'Turkmenistani Manat', 134
  UNION ALL SELECT 'TND', 'Tunisian Dinar', 135
  UNION ALL SELECT 'TOP', 'Tongan Pa''anga', 136
  UNION ALL SELECT 'TRY', 'Turkish Lira', 137
  UNION ALL SELECT 'TTD', 'Trinidad and Tobago Dollar', 138
  UNION ALL SELECT 'TWD', 'New Taiwan Dollar', 139
  UNION ALL SELECT 'TZS', 'Tanzanian Shilling', 140
  UNION ALL SELECT 'UAH', 'Ukrainian Hryvnia', 141
  UNION ALL SELECT 'UGX', 'Ugandan Shilling', 142
  UNION ALL SELECT 'USD', 'United States Dollar', 143
  UNION ALL SELECT 'UYU', 'Uruguayan Peso', 144
  UNION ALL SELECT 'UZS', 'Uzbekistan Som', 145
  UNION ALL SELECT 'VES', 'Venezuelan Bolivar Soberano', 146
  UNION ALL SELECT 'VND', 'Vietnamese Dong', 147
  UNION ALL SELECT 'VUV', 'Vanuatu Vatu', 148
  UNION ALL SELECT 'WST', 'Samoan Tala', 149
  UNION ALL SELECT 'XAF', 'Central African CFA Franc', 150
  UNION ALL SELECT 'XCD', 'East Caribbean Dollar', 151
  UNION ALL SELECT 'XOF', 'West African CFA Franc', 152
  UNION ALL SELECT 'XPF', 'CFP Franc', 153
  UNION ALL SELECT 'YER', 'Yemeni Rial', 154
  UNION ALL SELECT 'ZAR', 'South African Rand', 155
  UNION ALL SELECT 'ZMW', 'Zambian Kwacha', 156
  UNION ALL SELECT 'ZWL', 'Zimbabwean Dollar', 157
) AS seed
INNER JOIN system_codes system_code
  ON system_code.system_code = 'CurrencyCode';

INSERT IGNORE INTO users (
  organization_id,
  username,
  display_name,
  email,
  password_sha256,
  password_algo,
  user_type,
  status
)
SELECT
  organization.id,
  seed.username,
  seed.display_name,
  seed.email,
  SHA2(seed.password_plaintext, 256),
  'SHA256',
  seed.user_type,
  'ACTIVE'
FROM (
  SELECT 'root1' AS username, 'Root 1' AS display_name, 'root1@example.com' AS email, 'root1password' AS password_plaintext, 'ADMIN' AS user_type
  UNION ALL SELECT 'root2', 'Root 2', 'root2@example.com', 'root2password', 'ADMIN'
  UNION ALL SELECT 'user1', 'User 1', 'user1@example.com', 'user1password', 'NORMAL'
  UNION ALL SELECT 'user2', 'User 2', 'user2@example.com', 'user2password', 'NORMAL'
) AS seed
INNER JOIN organizations organization
  ON organization.organization_code = 'owner';

INSERT IGNORE INTO user_groups (
  organization_id,
  group_code,
  group_name,
  description,
  status
)
SELECT
  organization.id,
  seed.group_code,
  seed.group_name,
  seed.description,
  'ACTIVE'
FROM (
  SELECT 'OwnerAdmin' AS group_code, 'Owner Admin' AS group_name, 'Administrative group for owner root users.' AS description
  UNION ALL SELECT 'OwnerUser', 'Owner User', 'Standard owner users with limited menu visibility.'
  UNION ALL SELECT 'UserGroupMaker', 'User Group Maker', 'Can submit create, update, and delete requests for user groups.'
  UNION ALL SELECT 'UserGroupChecker', 'User Group Checker', 'Can approve or reject pending user group requests.'
  UNION ALL SELECT 'UserMaker', 'User Maker', 'Can submit create, update, and delete requests for users.'
  UNION ALL SELECT 'UserChecker', 'User Checker', 'Can approve or reject pending user requests.'
  UNION ALL SELECT 'OrganizationMaker', 'Organization Maker', 'Can submit create, update, and delete requests for organizations.'
  UNION ALL SELECT 'OrganizationChecker', 'Organization Checker', 'Can approve or reject pending organization requests.'
) AS seed
INNER JOIN organizations organization
  ON organization.organization_code = 'owner';

INSERT IGNORE INTO user_group_memberships (
  user_group_id,
  user_id
)
SELECT
  user_group.id,
  user.id
FROM (
  SELECT 'OwnerAdmin' AS group_code, 'root1' AS username
  UNION ALL SELECT 'OwnerAdmin', 'root2'
  UNION ALL SELECT 'OwnerUser', 'user1'
  UNION ALL SELECT 'OwnerUser', 'user2'
  UNION ALL SELECT 'UserGroupMaker', 'root1'
  UNION ALL SELECT 'UserGroupChecker', 'root1'
  UNION ALL SELECT 'UserGroupChecker', 'root2'
  UNION ALL SELECT 'UserMaker', 'root1'
  UNION ALL SELECT 'UserChecker', 'root1'
  UNION ALL SELECT 'UserChecker', 'root2'
  UNION ALL SELECT 'OrganizationMaker', 'root1'
  UNION ALL SELECT 'OrganizationChecker', 'root1'
  UNION ALL SELECT 'OrganizationChecker', 'root2'
) AS seed
INNER JOIN organizations organization
  ON organization.organization_code = 'owner'
INNER JOIN user_groups user_group
  ON user_group.organization_id = organization.id
  AND user_group.group_code = seed.group_code
INNER JOIN users user
  ON user.organization_id = organization.id
  AND user.username = seed.username;

INSERT IGNORE INTO user_group_permissions (
  user_group_id,
  permission_id
)
SELECT 
  -- Menu-driven workspace overview
  user_group.id,
  permission.id
FROM (
  SELECT 'OwnerAdmin' AS group_code, 'MENU_TRANSACTION_OVERVIEW' AS permission_code
  UNION ALL SELECT 'OwnerAdmin', 'MENU_TRANSACTION_INVOICES'
  UNION ALL SELECT 'OwnerAdmin', 'MENU_TRANSACTION_PAYMENTS'
  UNION ALL SELECT 'OwnerAdmin', 'MENU_ADMIN_USERS'
  UNION ALL SELECT 'OwnerAdmin', 'MENU_ADMIN_AUDIT_LOG'
  UNION ALL SELECT 'OwnerAdmin', 'USER_READ'
  UNION ALL SELECT 'OwnerAdmin', 'USER_GROUP_READ'
  UNION ALL SELECT 'OwnerAdmin', 'AUDIT_LOG_READ'

  UNION ALL SELECT 'OwnerAdmin', 'MENU_ADMIN_ORGANIZATION'
  UNION ALL SELECT 'OwnerAdmin', 'ORGANIZATION_READ'

  UNION ALL SELECT 'OwnerAdmin', 'MENU_ADMIN_APPROVAL_REQUEST'
  UNION ALL SELECT 'OwnerAdmin', 'APPROVAL_REQUEST_READ'

  UNION ALL SELECT 'OrganizationMaker', 'MENU_ADMIN_ORGANIZATION'
  UNION ALL SELECT 'OrganizationMaker', 'ORGANIZATION_READ'
  UNION ALL SELECT 'OrganizationMaker', 'ORGANIZATION_WRITE'

  UNION ALL SELECT 'OrganizationChecker', 'MENU_ADMIN_ORGANIZATION'
  UNION ALL SELECT 'OrganizationChecker', 'ORGANIZATION_READ'
  UNION ALL SELECT 'OrganizationChecker', 'ORGANIZATION_APPROVE'

  UNION ALL SELECT 'OrganizationChecker', 'MENU_ADMIN_APPROVAL_REQUEST'
  UNION ALL SELECT 'OrganizationChecker', 'APPROVAL_REQUEST_READ'

  UNION ALL SELECT 'UserGroupMaker', 'MENU_ADMIN_USER_GROUP'
  UNION ALL SELECT 'UserGroupMaker', 'USER_GROUP_READ'
  UNION ALL SELECT 'UserGroupMaker', 'USER_GROUP_WRITE'

  UNION ALL SELECT 'UserGroupChecker', 'MENU_ADMIN_USER_GROUP'
  UNION ALL SELECT 'UserGroupChecker', 'USER_GROUP_READ'
  UNION ALL SELECT 'UserGroupChecker', 'USER_GROUP_APPROVE'

  UNION ALL SELECT 'UserGroupChecker', 'MENU_ADMIN_APPROVAL_REQUEST'
  UNION ALL SELECT 'UserGroupChecker', 'APPROVAL_REQUEST_READ'

  UNION ALL SELECT 'UserMaker', 'MENU_ADMIN_USERS'
  UNION ALL SELECT 'UserMaker', 'USER_READ'
  UNION ALL SELECT 'UserMaker', 'USER_WRITE'

  UNION ALL SELECT 'UserChecker', 'MENU_ADMIN_USERS'
  UNION ALL SELECT 'UserChecker', 'USER_READ'
  UNION ALL SELECT 'UserChecker', 'USER_APPROVE'

  UNION ALL SELECT 'UserChecker', 'MENU_ADMIN_APPROVAL_REQUEST'
  UNION ALL SELECT 'UserChecker', 'APPROVAL_REQUEST_READ'

  UNION ALL SELECT 'OwnerUser', 'MENU_TRANSACTION_OVERVIEW'
  UNION ALL SELECT 'OwnerUser', 'MENU_TRANSACTION_INVOICES'
  UNION ALL SELECT 'OwnerUser', 'MENU_ADMIN_USERS'
  UNION ALL SELECT 'OwnerUser', 'USER_READ'
  UNION ALL SELECT 'OwnerUser', 'USER_GROUP_READ'
) AS seed
INNER JOIN organizations organization
  ON organization.organization_code = 'owner'
INNER JOIN user_groups user_group
  ON user_group.organization_id = organization.id
  AND user_group.group_code = seed.group_code
INNER JOIN permissions permission
  ON permission.permission_code = seed.permission_code;