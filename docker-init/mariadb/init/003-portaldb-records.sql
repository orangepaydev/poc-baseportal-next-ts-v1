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

INSERT IGNORE INTO system_properties (
  property_code,
  description
) VALUES
  ('PortalConfig', 'Configuration for the Portal'),
  ('EngineConfig', 'Configuration for the Engine'),
  ('ReportConfig', 'Configuration for the Report generation');

INSERT IGNORE INTO system_property_codes (
  system_property_id,
  property_item_code,
  property_value,
  description
)
SELECT
  system_property.id,
  seed.property_item_code,
  seed.property_value,
  seed.description
FROM (
  SELECT 'PortalConfig' AS property_code, 'SecurityEnforcement' AS property_item_code, 'strict' AS property_value, 'Enforce the security' AS description
  UNION ALL SELECT 'PortalConfig', 'LoginLockedOutCount', '5', 'Indicate the number of in correct login that will cause account to be locked out'
  UNION ALL SELECT 'PortalConfig', 'QueryMaxRecord', '1000', 'Max number of record that will be returned by the query'
  UNION ALL SELECT 'EngineConfig', 'RestRequestTimeoutMSec', '500', 'The Rest timeout in Mili seconds'
  UNION ALL SELECT 'EngineConfig', 'RequestRetryCount', '2', 'the number of retries the Rest request will be attempted'
  UNION ALL SELECT 'ReportConfig', 'MaxReportSizeMB', '100', 'the max size of the report'
) AS seed
INNER JOIN system_properties system_property
  ON system_property.property_code = seed.property_code;

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

INSERT IGNORE INTO system_codes (
  system_code,
  description,
  status
) VALUES (
  'CountryCode',
  'List of countries as per ISO 3166-1 alpha-2 two-letter codes',
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
  SELECT 'AF' AS system_code_value, 'Afghanistan' AS description, 1 AS sort_order
  UNION ALL SELECT 'AX', 'Åland Islands', 2
  UNION ALL SELECT 'AL', 'Albania', 3
  UNION ALL SELECT 'DZ', 'Algeria', 4
  UNION ALL SELECT 'AS', 'American Samoa', 5
  UNION ALL SELECT 'AD', 'Andorra', 6
  UNION ALL SELECT 'AO', 'Angola', 7
  UNION ALL SELECT 'AI', 'Anguilla', 8
  UNION ALL SELECT 'AQ', 'Antarctica', 9
  UNION ALL SELECT 'AG', 'Antigua and Barbuda', 10
  UNION ALL SELECT 'AR', 'Argentina', 11
  UNION ALL SELECT 'AM', 'Armenia', 12
  UNION ALL SELECT 'AW', 'Aruba', 13
  UNION ALL SELECT 'AU', 'Australia', 14
  UNION ALL SELECT 'AT', 'Austria', 15
  UNION ALL SELECT 'AZ', 'Azerbaijan', 16
  UNION ALL SELECT 'BS', 'Bahamas', 17
  UNION ALL SELECT 'BH', 'Bahrain', 18
  UNION ALL SELECT 'BD', 'Bangladesh', 19
  UNION ALL SELECT 'BB', 'Barbados', 20
  UNION ALL SELECT 'BY', 'Belarus', 21
  UNION ALL SELECT 'BE', 'Belgium', 22
  UNION ALL SELECT 'BZ', 'Belize', 23
  UNION ALL SELECT 'BJ', 'Benin', 24
  UNION ALL SELECT 'BM', 'Bermuda', 25
  UNION ALL SELECT 'BT', 'Bhutan', 26
  UNION ALL SELECT 'BO', 'Bolivia, Plurinational State of', 27
  UNION ALL SELECT 'BQ', 'Bonaire, Sint Eustatius and Saba', 28
  UNION ALL SELECT 'BA', 'Bosnia and Herzegovina', 29
  UNION ALL SELECT 'BW', 'Botswana', 30
  UNION ALL SELECT 'BV', 'Bouvet Island', 31
  UNION ALL SELECT 'BR', 'Brazil', 32
  UNION ALL SELECT 'IO', 'British Indian Ocean Territory', 33
  UNION ALL SELECT 'BN', 'Brunei Darussalam', 34
  UNION ALL SELECT 'BG', 'Bulgaria', 35
  UNION ALL SELECT 'BF', 'Burkina Faso', 36
  UNION ALL SELECT 'BI', 'Burundi', 37
  UNION ALL SELECT 'KH', 'Cambodia', 38
  UNION ALL SELECT 'CM', 'Cameroon', 39
  UNION ALL SELECT 'CA', 'Canada', 40
  UNION ALL SELECT 'CV', 'Cape Verde', 41
  UNION ALL SELECT 'KY', 'Cayman Islands', 42
  UNION ALL SELECT 'CF', 'Central African Republic', 43
  UNION ALL SELECT 'TD', 'Chad', 44
  UNION ALL SELECT 'CL', 'Chile', 45
  UNION ALL SELECT 'CN', 'China', 46
  UNION ALL SELECT 'CX', 'Christmas Island', 47
  UNION ALL SELECT 'CC', 'Cocos (Keeling) Islands', 48
  UNION ALL SELECT 'CO', 'Colombia', 49
  UNION ALL SELECT 'KM', 'Comoros', 50
  UNION ALL SELECT 'CG', 'Congo', 51
  UNION ALL SELECT 'CD', 'Congo, the Democratic Republic of the', 52
  UNION ALL SELECT 'CK', 'Cook Islands', 53
  UNION ALL SELECT 'CR', 'Costa Rica', 54
  UNION ALL SELECT 'CI', 'Côte d''Ivoire', 55
  UNION ALL SELECT 'HR', 'Croatia', 56
  UNION ALL SELECT 'CU', 'Cuba', 57
  UNION ALL SELECT 'CW', 'Curaçao', 58
  UNION ALL SELECT 'CY', 'Cyprus', 59
  UNION ALL SELECT 'CZ', 'Czech Republic', 60
  UNION ALL SELECT 'DK', 'Denmark', 61
  UNION ALL SELECT 'DJ', 'Djibouti', 62
  UNION ALL SELECT 'DM', 'Dominica', 63
  UNION ALL SELECT 'DO', 'Dominican Republic', 64
  UNION ALL SELECT 'EC', 'Ecuador', 65
  UNION ALL SELECT 'EG', 'Egypt', 66
  UNION ALL SELECT 'SV', 'El Salvador', 67
  UNION ALL SELECT 'GQ', 'Equatorial Guinea', 68
  UNION ALL SELECT 'ER', 'Eritrea', 69
  UNION ALL SELECT 'EE', 'Estonia', 70
  UNION ALL SELECT 'ET', 'Ethiopia', 71
  UNION ALL SELECT 'FK', 'Falkland Islands (Malvinas)', 72
  UNION ALL SELECT 'FO', 'Faroe Islands', 73
  UNION ALL SELECT 'FJ', 'Fiji', 74
  UNION ALL SELECT 'FI', 'Finland', 75
  UNION ALL SELECT 'FR', 'France', 76
  UNION ALL SELECT 'GF', 'French Guiana', 77
  UNION ALL SELECT 'PF', 'French Polynesia', 78
  UNION ALL SELECT 'TF', 'French Southern Territories', 79
  UNION ALL SELECT 'GA', 'Gabon', 80
  UNION ALL SELECT 'GM', 'Gambia', 81
  UNION ALL SELECT 'GE', 'Georgia', 82
  UNION ALL SELECT 'DE', 'Germany', 83
  UNION ALL SELECT 'GH', 'Ghana', 84
  UNION ALL SELECT 'GI', 'Gibraltar', 85
  UNION ALL SELECT 'GR', 'Greece', 86
  UNION ALL SELECT 'GL', 'Greenland', 87
  UNION ALL SELECT 'GD', 'Grenada', 88
  UNION ALL SELECT 'GP', 'Guadeloupe', 89
  UNION ALL SELECT 'GU', 'Guam', 90
  UNION ALL SELECT 'GT', 'Guatemala', 91
  UNION ALL SELECT 'GG', 'Guernsey', 92
  UNION ALL SELECT 'GN', 'Guinea', 93
  UNION ALL SELECT 'GW', 'Guinea-Bissau', 94
  UNION ALL SELECT 'GY', 'Guyana', 95
  UNION ALL SELECT 'HT', 'Haiti', 96
  UNION ALL SELECT 'HM', 'Heard Island and McDonald Islands', 97
  UNION ALL SELECT 'VA', 'Holy See (Vatican City State)', 98
  UNION ALL SELECT 'HN', 'Honduras', 99
  UNION ALL SELECT 'HK', 'Hong Kong', 100
  UNION ALL SELECT 'HU', 'Hungary', 101
  UNION ALL SELECT 'IS', 'Iceland', 102
  UNION ALL SELECT 'IN', 'India', 103
  UNION ALL SELECT 'ID', 'Indonesia', 104
  UNION ALL SELECT 'IR', 'Iran, Islamic Republic of', 105
  UNION ALL SELECT 'IQ', 'Iraq', 106
  UNION ALL SELECT 'IE', 'Ireland', 107
  UNION ALL SELECT 'IM', 'Isle of Man', 108
  UNION ALL SELECT 'IL', 'Israel', 109
  UNION ALL SELECT 'IT', 'Italy', 110
  UNION ALL SELECT 'JM', 'Jamaica', 111
  UNION ALL SELECT 'JP', 'Japan', 112
  UNION ALL SELECT 'JE', 'Jersey', 113
  UNION ALL SELECT 'JO', 'Jordan', 114
  UNION ALL SELECT 'KZ', 'Kazakhstan', 115
  UNION ALL SELECT 'KE', 'Kenya', 116
  UNION ALL SELECT 'KI', 'Kiribati', 117
  UNION ALL SELECT 'KP', 'Korea, Democratic People''s Republic of', 118
  UNION ALL SELECT 'KR', 'Korea, Republic of', 119
  UNION ALL SELECT 'KW', 'Kuwait', 120
  UNION ALL SELECT 'KG', 'Kyrgyzstan', 121
  UNION ALL SELECT 'LA', 'Lao People''s Democratic Republic', 122
  UNION ALL SELECT 'LV', 'Latvia', 123
  UNION ALL SELECT 'LB', 'Lebanon', 124
  UNION ALL SELECT 'LS', 'Lesotho', 125
  UNION ALL SELECT 'LR', 'Liberia', 126
  UNION ALL SELECT 'LY', 'Libya', 127
  UNION ALL SELECT 'LI', 'Liechtenstein', 128
  UNION ALL SELECT 'LT', 'Lithuania', 129
  UNION ALL SELECT 'LU', 'Luxembourg', 130
  UNION ALL SELECT 'MO', 'Macao', 131
  UNION ALL SELECT 'MK', 'Macedonia, the Former Yugoslav Republic of', 132
  UNION ALL SELECT 'MG', 'Madagascar', 133
  UNION ALL SELECT 'MW', 'Malawi', 134
  UNION ALL SELECT 'MY', 'Malaysia', 135
  UNION ALL SELECT 'MV', 'Maldives', 136
  UNION ALL SELECT 'ML', 'Mali', 137
  UNION ALL SELECT 'MT', 'Malta', 138
  UNION ALL SELECT 'MH', 'Marshall Islands', 139
  UNION ALL SELECT 'MQ', 'Martinique', 140
  UNION ALL SELECT 'MR', 'Mauritania', 141
  UNION ALL SELECT 'MU', 'Mauritius', 142
  UNION ALL SELECT 'YT', 'Mayotte', 143
  UNION ALL SELECT 'MX', 'Mexico', 144
  UNION ALL SELECT 'FM', 'Micronesia, Federated States of', 145
  UNION ALL SELECT 'MD', 'Moldova, Republic of', 146
  UNION ALL SELECT 'MC', 'Monaco', 147
  UNION ALL SELECT 'MN', 'Mongolia', 148
  UNION ALL SELECT 'ME', 'Montenegro', 149
  UNION ALL SELECT 'MS', 'Montserrat', 150
  UNION ALL SELECT 'MA', 'Morocco', 151
  UNION ALL SELECT 'MZ', 'Mozambique', 152
  UNION ALL SELECT 'MM', 'Myanmar', 153
  UNION ALL SELECT 'NA', 'Namibia', 154
  UNION ALL SELECT 'NR', 'Nauru', 155
  UNION ALL SELECT 'NP', 'Nepal', 156
  UNION ALL SELECT 'NL', 'Netherlands', 157
  UNION ALL SELECT 'NC', 'New Caledonia', 158
  UNION ALL SELECT 'NZ', 'New Zealand', 159
  UNION ALL SELECT 'NI', 'Nicaragua', 160
  UNION ALL SELECT 'NE', 'Niger', 161
  UNION ALL SELECT 'NG', 'Nigeria', 162
  UNION ALL SELECT 'NU', 'Niue', 163
  UNION ALL SELECT 'NF', 'Norfolk Island', 164
  UNION ALL SELECT 'MP', 'Northern Mariana Islands', 165
  UNION ALL SELECT 'NO', 'Norway', 166
  UNION ALL SELECT 'OM', 'Oman', 167
  UNION ALL SELECT 'PK', 'Pakistan', 168
  UNION ALL SELECT 'PW', 'Palau', 169
  UNION ALL SELECT 'PS', 'Palestine, State of', 170
  UNION ALL SELECT 'PA', 'Panama', 171
  UNION ALL SELECT 'PG', 'Papua New Guinea', 172
  UNION ALL SELECT 'PY', 'Paraguay', 173
  UNION ALL SELECT 'PE', 'Peru', 174
  UNION ALL SELECT 'PH', 'Philippines', 175
  UNION ALL SELECT 'PN', 'Pitcairn', 176
  UNION ALL SELECT 'PL', 'Poland', 177
  UNION ALL SELECT 'PT', 'Portugal', 178
  UNION ALL SELECT 'PR', 'Puerto Rico', 179
  UNION ALL SELECT 'QA', 'Qatar', 180
  UNION ALL SELECT 'RE', 'Réunion', 181
  UNION ALL SELECT 'RO', 'Romania', 182
  UNION ALL SELECT 'RU', 'Russian Federation', 183
  UNION ALL SELECT 'RW', 'Rwanda', 184
  UNION ALL SELECT 'BL', 'Saint Barthélemy', 185
  UNION ALL SELECT 'SH', 'Saint Helena, Ascension and Tristan da Cunha', 186
  UNION ALL SELECT 'KN', 'Saint Kitts and Nevis', 187
  UNION ALL SELECT 'LC', 'Saint Lucia', 188
  UNION ALL SELECT 'MF', 'Saint Martin (French part)', 189
  UNION ALL SELECT 'PM', 'Saint Pierre and Miquelon', 190
  UNION ALL SELECT 'VC', 'Saint Vincent and the Grenadines', 191
  UNION ALL SELECT 'WS', 'Samoa', 192
  UNION ALL SELECT 'SM', 'San Marino', 193
  UNION ALL SELECT 'ST', 'Sao Tome and Principe', 194
  UNION ALL SELECT 'SA', 'Saudi Arabia', 195
  UNION ALL SELECT 'SN', 'Senegal', 196
  UNION ALL SELECT 'RS', 'Serbia', 197
  UNION ALL SELECT 'SC', 'Seychelles', 198
  UNION ALL SELECT 'SL', 'Sierra Leone', 199
  UNION ALL SELECT 'SG', 'Singapore', 200
  UNION ALL SELECT 'SX', 'Sint Maarten (Dutch part)', 201
  UNION ALL SELECT 'SK', 'Slovakia', 202
  UNION ALL SELECT 'SI', 'Slovenia', 203
  UNION ALL SELECT 'SB', 'Solomon Islands', 204
  UNION ALL SELECT 'SO', 'Somalia', 205
  UNION ALL SELECT 'ZA', 'South Africa', 206
  UNION ALL SELECT 'GS', 'South Georgia and the South Sandwich Islands', 207
  UNION ALL SELECT 'SS', 'South Sudan', 208
  UNION ALL SELECT 'ES', 'Spain', 209
  UNION ALL SELECT 'LK', 'Sri Lanka', 210
  UNION ALL SELECT 'SD', 'Sudan', 211
  UNION ALL SELECT 'SR', 'Suriname', 212
  UNION ALL SELECT 'SJ', 'Svalbard and Jan Mayen', 213
  UNION ALL SELECT 'SZ', 'Eswatini', 214
  UNION ALL SELECT 'SE', 'Sweden', 215
  UNION ALL SELECT 'CH', 'Switzerland', 216
  UNION ALL SELECT 'SY', 'Syrian Arab Republic', 217
  UNION ALL SELECT 'TW', 'Taiwan, Province of China', 218
  UNION ALL SELECT 'TJ', 'Tajikistan', 219
  UNION ALL SELECT 'TZ', 'Tanzania, United Republic of', 220
  UNION ALL SELECT 'TH', 'Thailand', 221
  UNION ALL SELECT 'TL', 'Timor-Leste', 222
  UNION ALL SELECT 'TG', 'Togo', 223
  UNION ALL SELECT 'TK', 'Tokelau', 224
  UNION ALL SELECT 'TO', 'Tonga', 225
  UNION ALL SELECT 'TT', 'Trinidad and Tobago', 226
  UNION ALL SELECT 'TN', 'Tunisia', 227
  UNION ALL SELECT 'TR', 'Turkey', 228
  UNION ALL SELECT 'TM', 'Turkmenistan', 229
  UNION ALL SELECT 'TC', 'Turks and Caicos Islands', 230
  UNION ALL SELECT 'TV', 'Tuvalu', 231
  UNION ALL SELECT 'UG', 'Uganda', 232
  UNION ALL SELECT 'UA', 'Ukraine', 233
  UNION ALL SELECT 'AE', 'United Arab Emirates', 234
  UNION ALL SELECT 'GB', 'United Kingdom', 235
  UNION ALL SELECT 'US', 'United States', 236
  UNION ALL SELECT 'UM', 'United States Minor Outlying Islands', 237
  UNION ALL SELECT 'UY', 'Uruguay', 238
  UNION ALL SELECT 'UZ', 'Uzbekistan', 239
  UNION ALL SELECT 'VU', 'Vanuatu', 240
  UNION ALL SELECT 'VE', 'Venezuela, Bolivarian Republic of', 241
  UNION ALL SELECT 'VN', 'Viet Nam', 242
  UNION ALL SELECT 'VG', 'Virgin Islands, British', 243
  UNION ALL SELECT 'VI', 'Virgin Islands, U.S.', 244
  UNION ALL SELECT 'WF', 'Wallis and Futuna', 245
  UNION ALL SELECT 'EH', 'Western Sahara', 246
  UNION ALL SELECT 'YE', 'Yemen', 247
  UNION ALL SELECT 'ZM', 'Zambia', 248
  UNION ALL SELECT 'ZW', 'Zimbabwe', 249
) AS seed
INNER JOIN system_codes system_code
  ON system_code.system_code = 'CountryCode';

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
  UNION ALL SELECT 'OwnerAdmin', 'MENU_ADMIN_SYSTEM_CODE'
  UNION ALL SELECT 'OwnerAdmin', 'MENU_ADMIN_AUDIT_LOG'
  UNION ALL SELECT 'OwnerAdmin', 'USER_READ'
  UNION ALL SELECT 'OwnerAdmin', 'SYSTEM_CODE_READ'
  UNION ALL SELECT 'OwnerAdmin', 'SYSTEM_CODE_WRITE'
  UNION ALL SELECT 'OwnerAdmin', 'SYSTEM_CODE_APPROVE'
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