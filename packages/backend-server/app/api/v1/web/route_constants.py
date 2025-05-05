# Web API Routes

BASE_URL = "/{workspace_id}/{project_id}"

# Accounts
ACCOUNTS = BASE_URL + "/accounts"
ACCOUNTS_LIST = BASE_URL + "/accounts/list"
ACCOUNT_DETAILS = BASE_URL + "/accounts/{doc_id}"

# API Keys
API_KEYS = BASE_URL + "/api_keys"
API_KEYS_LIST = BASE_URL + "/api_keys/list"
API_KEY_DETAILS = BASE_URL + "/api_keys/{doc_id}"

# Wallet Phrases
WALLET_PHRASES = BASE_URL + "/wallet-phrases"
WALLET_PHRASE_LIST = BASE_URL + "/wallet-phrases/list"
WALLET_PHRASE_DETAILS = BASE_URL + "/wallet-phrases/{doc_id}"

# Wifi
WIFI = BASE_URL + "/wifi"
WIFI_LIST = BASE_URL + "/wifi/list"
WIFI_DETAILS = BASE_URL + "/wifi/{doc_id}"

# Cards
CARDS = BASE_URL + "/cards"
CARDS_LIST = BASE_URL + "/cards/list"
CARD_DETAILS = BASE_URL + "/cards/{doc_id}"

# Identities
IDENTITY = BASE_URL + "/identity"
IDENTITY_LIST = BASE_URL + "/identity/list"
IDENTITY_DETAILS = BASE_URL + "/identity/{doc_id}"


# Licenses
LICENSE = BASE_URL + "/licenses"
LICENSE_LIST = BASE_URL + "/licenses/list"
LICENSE_DETAILS = BASE_URL + "/licenses/{doc_id}"

# Emails
EMAILS = BASE_URL + "/emails"
EMAIL_LIST = BASE_URL + "/emails/list"
EMAIL_DETAILS = BASE_URL + "/emails/{doc_id}"

# Login
LOGIN = "/login"
LOGOUT = "/logout"
TWO_FACTOR_AUTH = "/2fa/verify"

# Audit Logs
AUDIT_LOGS = "/{workspace_id}/audit-logs"
AUDIT_LOG_ACTIONS = "/audit-log-actions"

# Projects
PROJECTS = "/{workspace_id}/projects"
PROJECT_DETAILS = "/{workspace_id}/projects/{doc_id}"
TAGS = "/{workspace_id}/{project_id}/tags"

# User
FAVORITE_TAGS = "/favorite-tags"
PROFILE = "/profile"
LOGIN_HISTORY = "/login-history"


# Workspace
LOAD_INITIAL_DATA = "/load-initial-data"
TAGS = "/{workspace_id}/tags"
