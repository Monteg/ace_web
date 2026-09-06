# Ace CMS Google Sheets bridge

Copy `AceCms.gs` and `appsscript.json` into the Apps Script project attached to the existing Ace Games spreadsheet, then set the scoped connection through **Ace CMS → 1. Настроить подключение**. Production publishing remains disabled until the `ACE_TRUSTED_PUBLISHERS` Script Property contains a comma-separated allow-list of Google account emails.

The script deliberately contains no Webflow token, collection ID, site ID, host, or asset-upload code. CMS credentials belong to a dedicated Directus **Sheet Integration** account, never an administrator.
