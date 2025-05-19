# Web API Routes

BASE_URL = "/{workspace_id}/{project_id}"

# Accounts
ACCOUNTS = BASE_URL + "/accounts"
ACCOUNT_DETAILS = BASE_URL + "/accounts/{doc_id}"

# API Keys
API_KEYS = BASE_URL + "/api-keys"
API_KEY_DETAILS = BASE_URL + "/api-keys/{doc_id}"

# Wallet Phrases
WALLET_PHRASES = BASE_URL + "/wallet-phrases"
WALLET_PHRASE_DETAILS = BASE_URL + "/wallet-phrases/{doc_id}"

# Wifi
WIFI = BASE_URL + "/wifi"
WIFI_DETAILS = BASE_URL + "/wifi/{doc_id}"

# Cards
CARDS = BASE_URL + "/cards"
CARD_DETAILS = BASE_URL + "/cards/{doc_id}"

# Identities
IDENTITY = BASE_URL + "/identity"
IDENTITY_DETAILS = BASE_URL + "/identity/{doc_id}"


# Licenses
LICENSE = BASE_URL + "/licenses"
LICENSE_DETAILS = BASE_URL + "/licenses/{doc_id}"

# Emails
EMAILS = BASE_URL + "/emails"
EMAIL_DETAILS = BASE_URL + "/emails/{doc_id}"

# SSH Keys
SSH_KEYS = BASE_URL + "/ssh-keys"
SSH_KEY_DETAILS = BASE_URL + "/ssh-keys/{doc_id}"

# Login
LOGIN = "/login"
LOGOUT = "/logout"
TWO_FACTOR_AUTH = "/2fa/verify"
GET_KEYS = "/get-key"
UPDATE_KEYS = "/update-key"


# Audit Logs
AUDIT_LOGS = "/{workspace_id}/audit-logs"
AUDIT_LOG_ACTIONS = "/audit-log-actions"

# Projects
PROJECTS = "/{workspace_id}/projects"
PROJECT_DETAILS = "/{workspace_id}/projects/{doc_id}"
TAGS = "/{workspace_id}/{project_id}/tags"
PROJECT_KEYS = "/{workspace_id}/project-keys"

# User
FAVORITE_TAGS = "/favorite-tags"
PROFILE = "/profile"
LOGIN_HISTORY = "/login-history"


# Workspace
LOAD_INITIAL_DATA = "/load-initial-data"
TAGS = "/{workspace_id}/tags"
