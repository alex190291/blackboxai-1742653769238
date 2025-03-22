// Italian translations
const translations = {
    'Dashboard': 'Dashboard',
    'RTAD Overview': 'Panoramica RTAD',
    'Reverse Proxy': 'Proxy Inverso',
    'WireGuard VPN': 'WireGuard VPN',
    'Settings': 'Impostazioni',
    'Update': 'Aggiorna',
    'Check': 'Verifica',
    'Delete': 'Elimina',
    'Confirm': 'Conferma',
    'Cancel': 'Annulla',
    'Success': 'Successo',
    'Error': 'Errore',
    'Loading': 'Caricamento...',
    'No data available': 'Nessun dato disponibile',
    'Please wait': 'Attendere prego...',
    'Are you sure?': 'Sei sicuro?',
    'This action cannot be undone': 'Questa azione non può essere annullata',
    'Yes, delete it!': 'Sì, eliminalo!',
    'No, cancel': 'No, annulla',
    'Updated successfully': 'Aggiornato con successo',
    'Update failed': 'Aggiornamento fallito',
    'Check completed': 'Verifica completata',
    'Check failed': 'Verifica fallita',
    'Deleted successfully': 'Eliminato con successo',
    'Delete failed': 'Eliminazione fallita',
    
    /* Adding Settings Translations */
    // Page title
    'Application Settings': 'Impostazioni Applicazione',
    
    // Section titles
    'Reverse Proxy Settings': 'Impostazioni Proxy Inverso',
    'Log Settings': 'Impostazioni Log',
    'General Settings': 'Impostazioni Generali',
    'Security Settings': 'Impostazioni di Sicurezza',
    'WireGuard Settings': 'Impostazioni WireGuard',
    'Account Settings': 'Impostazioni Account',
    'Session Management': 'Gestione Sessioni',
    'User Management': 'Gestione Utenti',
    'Services Configuration': 'Configurazione Servizi',
    'User Preferences': 'Preferenze Utente',
    
    // Color settings
    'Primary Color': 'Colore Primario',
    'Reset to Default': 'Ripristina Predefiniti',
    
    // NPM settings
    'Domain': 'Dominio',
    'Identity': 'Identità',
    'Secret': 'Segreto',
    'Install Reverse Proxy': 'Installa Proxy Inverso',
    'Already Installed': 'Già installato',
    
    // WireGuard settings
    'Install WireGuard VPN Server': 'Installa Server VPN WireGuard',
    'Public IP Address': 'Indirizzo IP Pubblico',
    'Public IP Address Hint': 'L\'indirizzo IP pubblico a cui i client si connetteranno',
    
    // Container status
    'Running': 'In esecuzione',
    'Installed': 'Installato',
    'Not Installed': 'Non installato',
    'Start Container': 'Avvia Container',
    'Stop Container': 'Ferma Container',
    'Container': 'Container',
    'started successfully.': 'avviato con successo.',
    'stopped successfully.': 'fermato con successo.',
    'Are you sure you want to stop the': 'Sei sicuro di voler fermare il',
    'container?': 'container?',
    'exited': 'terminato',
    
    // Account settings
    'Email Address': 'Indirizzo Email',
    'New Password': 'Nuova Password',
    'Confirm Password': 'Conferma Password',
    'Enter new password': 'Inserisci nuova password',
    'Confirm new password': 'Conferma nuova password',
    'Update Credentials': 'Aggiorna Credenziali',
    
    // Log settings
    'Parse All Logs': 'Analizza Tutti i Log',
    'Log Files': 'File di Log',
    'Path': 'Percorso',
    'Type': 'Tipo',
    'Remove logfile': 'Rimuovi file di log',
    'Add Log File': 'Aggiungi File di Log',
    
    // General settings
    'Timezone': 'Fuso Orario',
    
    // Security settings
    'Secret Key': 'Chiave Segreta',
    'Password Salt': 'Salt della Password',
    'Default Admin Account': 'Account Admin Predefinito',
    'Admin Email': 'Email Admin',
    'Admin Password': 'Password Admin',
    
    // Actions
    'Save Settings': 'Salva Impostazioni',
    
    // Notifications
    'Settings saved successfully.': 'Impostazioni salvate con successo.',
    'Error saving settings:': 'Errore nel salvare le impostazioni:',
    'Are you sure you want to deploy the Nginx Proxy Manager container?': 'Sei sicuro di voler distribuire il container Nginx Proxy Manager?',
    'Nginx Proxy Manager container deployment initiated successfully.': 'Distribuzione del container Nginx Proxy Manager avviata con successo.',
    'Are you sure you want to deploy the WireGuard VPN Server container?': 'Sei sicuro di voler distribuire il container del Server VPN WireGuard?',
    'WireGuard VPN Server container deployment initiated successfully.': 'Distribuzione del container del Server VPN WireGuard avviata con successo.',
    'Please enter a public IP address.': 'Inserisci un indirizzo IP pubblico.',
    'Please enter an email address.': 'Inserisci un indirizzo email.',
    'Passwords do not match.': 'Le password non corrispondono.',
    'Password must be at least 8 characters long.': 'La password deve contenere almeno 8 caratteri.',
    'Credentials updated successfully.': 'Credenziali aggiornate con successo.',
    'Error: ': 'Errore: ',
    
    // Confirmation modal
    'Deploy': 'Distribuisci',
    'Stop': 'Ferma',
    'Deploy Nginx Proxy Manager': 'Distribuisci Nginx Proxy Manager',
    'Stop NPM Container': 'Ferma Container NPM',
    'Are you sure you want to stop the NPM container?': 'Sei sicuro di voler fermare il container NPM?',
    'Deploy WireGuard VPN Server': 'Distribuisci Server VPN WireGuard',
    'Stop WireGuard Container': 'Ferma Container WireGuard',
    'Are you sure you want to stop the WireGuard container?': 'Sei sicuro di voler fermare il container WireGuard?',
    'Container deployment initiated successfully.': 'Distribuzione del container avviata con successo.',
    'Error:': 'Errore:',
    'Confirm Action': 'Conferma Azione',
    'Are you sure you want to perform this action?': 'Sei sicuro di voler eseguire questa azione?',
    
    // New notification messages
    'NPM container started successfully.': 'Container NPM avviato con successo.',
    'WireGuard container started successfully.': 'Container WireGuard avviato con successo.',
    'Container started successfully.': 'Container avviato con successo.',
    'NPM container stopped successfully.': 'Container NPM fermato con successo.',
    'WireGuard container stopped successfully.': 'Container WireGuard fermato con successo.',
    'Container stopped successfully.': 'Container fermato con successo.',
    'NPM container deployment initiated successfully.': 'Distribuzione del container NPM avviata con successo.',
    'WireGuard container deployment initiated successfully.': 'Distribuzione del container WireGuard avviata con successo.',
    
    // Session Management
    'Session Management': 'Gestione Sessioni',
    'Active Sessions': 'Sessioni Attive',
    'Loading Sessions...': 'Caricamento Sessioni...',
    'No active sessions found.': 'Nessuna sessione attiva trovata.',
    'Current Session': 'Sessione Attuale',
    'Current': 'Attuale',
    'Last Activity': 'Ultima Attività',
    'Device / Browser': 'Dispositivo / Browser',
    'IP Address': 'Indirizzo IP',
    'Logged in': 'Accesso effettuato',
    'Last active': 'Ultima attività',
    'Terminate Session': 'Termina Sessione',
    'Failed to load sessions.': 'Impossibile caricare le sessioni.',
    'Session terminated successfully.': 'Sessione terminata con successo.',
    'Current session terminated. Logging out...': 'Sessione attuale terminata. Disconnessione...',
    'Failed to terminate session.': 'Impossibile terminare la sessione.',
    'This will log you out of your current session. Continue?': 'Questo ti disconnetterà dalla sessione attuale. Continuare?',
    'Are you sure you want to terminate this session?': 'Sei sicuro di voler terminare questa sessione?',
    'Terminate': 'Termina',
    'You cannot terminate your current session.': 'Non puoi terminare la tua sessione attuale.',
    
    // User Management
    'User Management': 'Gestione Utenti',
    'Users': 'Utenti',
    'Loading Users...': 'Caricamento Utenti...',
    'Add User': 'Aggiungi Utente',
    'Add New User': 'Aggiungi Nuovo Utente',
    'Email': 'Email',
    'Status': 'Stato',
    'Actions': 'Azioni',
    'Active': 'Attivo',
    'Inactive': 'Inattivo',
    'Change Password': 'Cambia Password',
    'Delete User': 'Elimina Utente',
    'No users found.': 'Nessun utente trovato.',
    'Error loading users.': 'Errore nel caricamento degli utenti.',
    'Failed to load users.': 'Impossibile caricare gli utenti.',
    'Retry': 'Riprova',
    'Are you sure you want to delete user': 'Sei sicuro di voler eliminare l\'utente',
    'User added successfully.': 'Utente aggiunto con successo.',
    'Failed to add user.': 'Impossibile aggiungere l\'utente.',
    'User deleted successfully.': 'Utente eliminato con successo.',
    'Failed to delete user.': 'Impossibile eliminare l\'utente.',
    'Password changed successfully.': 'Password cambiata con successo.',
    'Failed to change password.': 'Impossibile cambiare la password.',
    'Please enter a new password.': 'Inserisci una nuova password.',
    'Password': 'Password',
    'Enter email address': 'Inserisci indirizzo email',
    'Enter password': 'Inserisci password',
    'Confirm password': 'Conferma password',
    
    // Browser and Device Information
    'on': 'su',
    'Unknown': 'Sconosciuto',
    'Desktop': 'Desktop',
    'Mobile': 'Mobile',
    'Tablet': 'Tablet',
    'Firefox': 'Firefox',
    'Chrome': 'Chrome',
    'Safari': 'Safari',
    'Edge': 'Edge',
    'Internet Explorer': 'Internet Explorer',
    'Opera': 'Opera',
    'Windows': 'Windows',
    'MacOS': 'MacOS',
    'Linux': 'Linux',
    'Android': 'Android',
    'iOS': 'iOS',
    
    // Time-related translations
    'Just now': 'Proprio ora',
    'minute': 'minuto',
    'minutes': 'minuti',
    'hour': 'ora',
    'hours': 'ore',
    'day': 'giorno',
    'days': 'giorni',
    'ago': 'fa',
    /* End of Settings Translations */
    
    'Check for updates': 'Verifica aggiornamenti',
    'Checking for updates...': 'Verifica aggiornamenti in corso...',
    'Checking': 'Verifica in corso',
    'Initializing': 'Inizializzazione',
    'failed': 'fallito',
    'N/A': 'N/D',
    'Error fetching /rtad_lastb data:': 'Errore nel recupero dei dati /rtad_lastb:',
    'Error fetching /rtad_proxy data:': 'Errore nel recupero dei dati /rtad_proxy:',
    'Important elements missing. Please check HTML IDs.': 'Elementi importanti mancanti. Controlla gli ID HTML.',
    'No custom graphs available.': 'Nessun grafico personalizzato disponibile.',
    'Delete this graph?': 'Eliminare questo grafico?',
    'Graph deleted successfully': 'Grafico eliminato con successo',
    'Error deleting graph:': 'Errore nell\'eliminazione del grafico:',
    'Error loading graph list:': 'Errore nel caricamento della lista dei grafici:',
    'Interface name': 'Nome interfaccia',
    'Label': 'Etichetta',
    'Remove': 'Rimuovi',
    'Graph saved successfully:': 'Grafico salvato con successo:',
    'Error saving graph:': 'Errore nel salvare il grafico:',
    'Download Config File': 'Scarica File di Configurazione',
    'Show QR': 'Mostra QR',
    'Download Config': 'Scarica Configurazione',
    'Edit': 'Modifica',
    'Edit Network Graph': 'Modifica Grafico di Rete',
    'Renew': 'Rinnova',
    'Download': 'Scarica',
    'General': 'Generale',
    'Custom Nginx Config': 'Configurazione Nginx Personalizzata',
    'Upload': 'Carica',
    'Create': 'Crea',
    'Create Certificate': 'Crea Certificato',
    'Certificate': 'Certificato',
    'Update Certificate': 'Aggiorna Certificato',
    'Add Authentication': 'Aggiungi Autenticazione',
    'Add Client': 'Aggiungi Client',
    'Create Access List': 'Crea Lista di Accesso',
    'Update Access List': 'Aggiorna Lista di Accesso',
    'Add Proxy Host': 'Aggiungi Host Proxy',
    'Add Redirection Host': 'Aggiungi Host di Redirezione',
    'Add Access List': 'Aggiungi Lista di Accesso',
    'Enable': 'Abilita',
    'Disable': 'Disabilita',
    'Uploading': 'Caricamento in corso...',
    'Provider': 'Provider',
    'Certificate Name': 'Nome Certificato',
    'Certificate File': 'File Certificato',
    'Domain Names (comma-separated)': 'Nomi di Dominio (separati da virgola)',
    'Email Address (for Let\'s Encrypt)': 'Indirizzo Email (per Let\'s Encrypt)',
    'Enable DNS Challenge': 'Abilita Sfida DNS',
    'Use DNS validation instead of HTTP validation': 'Usa validazione DNS invece della validazione HTTP',
    'DNS Challenge Information': 'Informazioni Sfida DNS',
    'DNS challenge allows you to validate domain ownership via DNS records when HTTP validation is not possible.': 'La sfida DNS ti permette di validare la proprietà del dominio tramite record DNS quando la validazione HTTP non è possibile.',
    'You\'ll need access to configure DNS records for your domain, either manually or via a supported DNS provider API.': 'Avrai bisogno di accesso per configurare i record DNS per il tuo dominio, manualmente o tramite un\'API del provider DNS supportata.',
    'DNS Provider': 'Provider DNS',
    'Provider Credentials': 'Credenziali Provider',
    'Enter provider-specific credentials': 'Inserisci credenziali specifiche del provider',
    'Format depends on provider. Will be automatically populated based on selection.': 'Il formato dipende dal provider. Sarà popolato automaticamente in base alla selezione.',
    'Propagation Wait Time (seconds)': 'Tempo di Attesa Propagazione (secondi)',
    'DNS propagation can take time. Increase this value if validation fails.': 'La propagazione DNS può richiedere tempo. Aumenta questo valore se la validazione fallisce.',
    'Advanced Settings (JSON)': 'Impostazioni Avanzate (JSON)',
    'Only modify if you know what you\'re doing.': 'Modifica solo se sai quello che stai facendo.',
    'Upload Certificate': 'Carica Certificato',
    'Replace Certificate': 'Sostituisci Certificato',
    'Certificate Key File': 'File Chiave Certificato',
    'Name': 'Nome',
    'Authorization': 'Autorizzazione',
    'Satisfy Any': 'Soddisfa Qualsiasi',
    'Satisfy All': 'Soddisfa Tutti',
    'Pass Auth to Upstream': 'Passa Auth a Upstream',
    'Basic Authentication': 'Autenticazione Base',
    'Client IP Restrictions': 'Restrizioni IP Client',
    'Username': 'Nome Utente',
    'Password': 'Password',
    'IP/CIDR or Domain': 'IP/CIDR o Dominio',
    'Allow': 'Permetti',
    'Deny': 'Nega',
    'Add Host': 'Aggiungi Host',
    'Update Host': 'Aggiorna Host',
    'Redirection Host Configuration': 'Configurazione Host di Redirezione',
    'HTTP Redirection Code': 'Codice di Redirezione HTTP',
    '301 (Permanent)': '301 (Permanente)',
    '302 (Temporary)': '302 (Temporaneo)',
    'Forward Domain Name': 'Nome Dominio di Inoltro',
    'Upstream Scheme': 'Schema Upstream',
    'Certificate': 'Certificato',
    'Preserve Path': 'Preserva Percorso',
    'Block Common Exploits': 'Blocca Exploit Comuni',
    'Force SSL': 'Forza SSL',
    'HTTP/2 Support': 'Supporto HTTP/2',
    'HSTS Enabled': 'HSTS Abilitato',
    'HSTS Subdomains': 'Sottodomini HSTS',
    'Forward Host': 'Host di Inoltro',
    'Forward Port': 'Porta di Inoltro',
    'Access List': 'Lista di Accesso',
    'None': 'Nessuno',
    'Cache Assets': 'Cache Risorse',
    'Websockets Support': 'Supporto Websockets',
    'Failed to load proxy hosts': 'Impossibile caricare gli host proxy',
    'Failed to load redirection hosts': 'Impossibile caricare gli host di redirezione',
    'Failed to edit redirection host': 'Impossibile modificare l\'host di redirezione',
    'Failed to load access lists': 'Impossibile caricare le liste di accesso',
    'Failed to load certificates': 'Impossibile caricare i certificati',
    'Failed to load audit log': 'Impossibile caricare il log di audit',
    'Failed to load dead hosts': 'Impossibile caricare gli host inattivi',
    'Failed to load reports': 'Impossibile caricare i report',
    'Forward': 'Inoltra',
    'Forced': 'Forzato',
    'Optional': 'Opzionale',
    'Cache': 'Cache',
    'Enabled': 'Abilitato',
    'Disabled': 'Disabilitato',
    'Redirect HTTP Code': 'Codice di Redirezione HTTP',
    'Forward Domain': 'Dominio di Inoltro',
    'Yes': 'Sì',
    'No': 'No',
    'Pass Auth': 'Passa Auth',
    'Auth Items': 'Elementi Auth',
    'Clients': 'Client',
    'days left': 'giorni rimanenti',
    'Expiring Soon': 'In Scadenza',
    'Expired': 'Scaduto',
    'Domains': 'Domini',
    'Expires': 'Scade',
    'CPU': 'CPU',
    'Usage': 'Utilizzo',
    '24hr CPU Usage': 'Utilizzo CPU 24h',
    'RAM': 'RAM',
    'Free': 'Libera',
    'Used': 'Utilizzata',
    'Cached': 'In Cache',
    '24hr RAM Usage': 'Utilizzo RAM 24h',
    'Disk': 'Disco',
    '7-Day Disk Used': 'Disco Utilizzato 7 Giorni',
    'Network Throughput': 'Throughput di Rete',
    'Input': 'Input',
    'Output': 'Output',
    'Custom Network Graph Settings': 'Impostazioni Grafico di Rete Personalizzato',
    'Docker Containers': 'Container Docker',
    'Status': 'Stato',
    'Uptime': 'Tempo di Attività',
    'Image': 'Immagine',
    'Actions': 'Azioni',
    'Toggle light/dark mode': 'Cambia modalità chiara/scura',
    'Graph Name': 'Nome Grafico',
    'Add Interface': 'Aggiungi Interfaccia',
    'Save': 'Salva',
    'Untitled': 'Senza titolo',
    'comma-separated': 'separati da virgola',
    'for Let\'s Encrypt': 'per Let\'s Encrypt',
    'JSON format': 'Formato JSON',
    'Hosts': 'Host',
    'Security': 'Sicurezza',
    'System': 'Sistema',
    'Proxy Hosts': 'Host Proxy',
    'Redirection Hosts': 'Host di Redirezione',
    'Access Lists': 'Liste di Accesso',
    'Certificates': 'Certificati',
    'Audit Log': 'Log di Audit',
    'Proxy Host': 'Host Proxy',
    'Redirection Host': 'Host di Redirezione',
    'Edit Redirection Host': 'Modifica Host di Redirezione',
    'Edit Proxy Host': 'Modifica Host Proxy',
    'Failed to edit proxy host': 'Impossibile modificare l\'host proxy',
    'HTTP Redirection Code': 'Codice di Redirezione HTTP',
    'Confirm Deletion': 'Conferma Eliminazione',
    'Are you sure you want to delete this item?': 'Sei sicuro di voler eliminare questo elemento?',
    'Search...': 'Cerca...',
    'Timestamp': 'Timestamp',
    'User': 'Utente',
    'Action': 'Azione',
    'Details': 'Dettagli',
    'Failed to open access list edit form': 'Impossibile aprire il modulo di modifica della lista di accesso',
    'Satisfy Any: match either auth OR IP restrictions. Satisfy All: require both.': 'Soddisfa Qualsiasi: corrisponde a restrizioni auth O IP. Soddisfa Tutti: richiede entrambi.',
    'Add IP addresses or CIDR ranges to restrict access by client IP. Example: 192.168.1.0/24 or 10.0.0.5': 'Aggiungi indirizzi IP o intervalli CIDR per limitare l\'accesso per IP client. Esempio: 192.168.1.0/24 o 10.0.0.5',
    'IP Address or CIDR Range': 'Indirizzo IP o Intervallo CIDR',
    'Examples: 192.168.1.1 or 10.0.0.0/24': 'Esempi: 192.168.1.1 o 10.0.0.0/24',
    'Add Client IP': 'Aggiungi IP Client',
    'Network Interfaces': 'Interfacce di Rete',
    'WireGuard VPN Clients': 'Client VPN WireGuard',
    'Enter new client name': 'Inserisci nome nuovo client',
    'Scan QR Code': 'Scansiona Codice QR',
    'Are you sure you want to delete this client?': 'Sei sicuro di voler eliminare questo client?',
    'IP': 'IP',
    'Created': 'Creato',
    'Last connection': 'Ultima connessione',
    'Never': 'Mai',
    'RealTime Attack Dashboard': 'Dashboard Attacchi in Tempo Reale',
    'Attack Map': 'Mappa Attacchi',
    'Login Attempts over SSH': 'Tentativi di Accesso SSH',
    'Proxy Events': 'Eventi Proxy',
    'IP Address': 'Indirizzo IP',
    'Country': 'Paese',
    'City': 'Città',
    'Failure Reason': 'Motivo Fallimento',
    'Domain': 'Dominio',
    'Proxy Type': 'Tipo Proxy',
    'Error Code': 'Codice Errore',
    'URL': 'URL',
    'Edit Access List': 'Modifica Lista di Accesso',
    
    // NPM Notifications
    'NPM API is not available': 'API NPM non disponibile',
    'Failed to connect to NPM API': 'Impossibile connettersi all\'API NPM',
    
    // Certificate notifications
    'Certificate renewal initiated': 'Rinnovo certificato avviato',
    'Failed to renew certificate': 'Impossibile rinnovare il certificato',
    'Certificate deleted successfully': 'Certificato eliminato con successo',
    'Failed to delete certificate': 'Impossibile eliminare il certificato',
    'Certificate request submitted successfully': 'Richiesta certificato inviata con successo',
    'Failed to create certificate:': 'Impossibile creare il certificato:',
    'Certificate successfully issued and validated!': 'Certificato emesso e validato con successo!',
    'Certificate validation timeout. This doesn\'t mean the certificate failed - ': 'Timeout validazione certificato. Questo non significa che il certificato sia fallito - ',
    'it may still be processing. Check the certificate status in a few minutes.': 'potrebbe essere ancora in elaborazione. Controlla lo stato del certificato tra qualche minuto.',
    'Certificate updated successfully': 'Certificato aggiornato con successo',
    'Failed to update certificate:': 'Impossibile aggiornare il certificato:',
    'Certificate validated successfully': 'Certificato validato con successo',
    'Certificate validation failed:': 'Validazione certificato fallita:',
    'Failed to download certificate': 'Impossibile scaricare il certificato',
    'Certificate uploaded successfully': 'Certificato caricato con successo',
    'Failed to upload certificate:': 'Impossibile caricare il certificato:',
    'Certificate created and uploaded successfully': 'Certificato creato e caricato con successo',
    'Failed to upload new certificate:': 'Impossibile caricare il nuovo certificato:',
    
    // Token notifications
    'Token refreshed': 'Token aggiornato',
    'Failed to refresh token': 'Impossibile aggiornare il token',
    'Token requested successfully': 'Token richiesto con successo',
    'Failed to request token': 'Impossibile richiedere il token',
    
    // Proxy host notifications
    'Proxy Host created successfully': 'Host Proxy creato con successo',
    'Failed to create host': 'Impossibile creare l\'host',
    'Host updated successfully': 'Host aggiornato con successo',
    'Failed to update host': 'Impossibile aggiornare l\'host',
    'Host deleted successfully': 'Host eliminato con successo',
    'Failed to delete host': 'Impossibile eliminare l\'host',
    'Proxy host enabled successfully': 'Host Proxy abilitato con successo',
    'Failed to enable proxy host': 'Impossibile abilitare l\'host proxy',
    'Proxy host disabled successfully': 'Host Proxy disabilitato con successo',
    'Failed to disable proxy host': 'Impossibile disabilitare l\'host proxy',
    
    // Redirection host notifications
    'Redirection Host created successfully': 'Host di Redirezione creato con successo',
    'Failed to create redirection host': 'Impossibile creare l\'host di redirezione',
    'Redirection host updated successfully': 'Host di Redirezione aggiornato con successo',
    'Failed to update redirection host': 'Impossibile aggiornare l\'host di redirezione',
    'Redirection host deleted successfully': 'Host di Redirezione eliminato con successo',
    'Failed to delete redirection host': 'Impossibile eliminare l\'host di redirezione',
    'Redirection host enabled successfully': 'Host di Redirezione abilitato con successo',
    'Failed to enable redirection host': 'Impossibile abilitare l\'host di redirezione',
    'Redirection host disabled successfully': 'Host di Redirezione disabilitato con successo',
    'Failed to disable redirection host': 'Impossibile disabilitare l\'host di redirezione',
    
    // Access list notifications
    'Failed to fetch access list details': 'Impossibile recuperare i dettagli della lista di accesso',
    'Access list updated successfully': 'Lista di accesso aggiornata con successo',
    'Failed to update access list': 'Impossibile aggiornare la lista di accesso',
    'Access list deleted successfully': 'Lista di accesso eliminata con successo',
    'Failed to delete access list': 'Impossibile eliminare la lista di accesso',
    'Access list created successfully': 'Lista di accesso creata con successo',
    'Failed to create access list': 'Impossibile creare la lista di accesso',
    'Are you sure you want to delete this access list?': 'Sei sicuro di voler eliminare questa lista di accesso?',
    'Are you sure you want to delete this proxy host?': 'Sei sicuro di voler eliminare questo host proxy?',
    'Are you sure you want to delete this redirection host?': 'Sei sicuro di voler eliminare questo host di redirezione?',
    'Valid Certificates': 'Certificati Validi',
    'Add Certificate': 'Aggiungi Certificato',
    'Upload Certificate': 'Carica Certificato',
    'Request New Certificate (No DNS Challenge)': 'Richiedi Nuovo Certificato (Senza Sfida DNS)',
    
    // Certificate form fields
    'Certificate Provider': 'Provider del Certificato',
    'Let\'s Encrypt': 'Let\'s Encrypt',
    'Custom': 'Personalizzato',
    'Certificate Name': 'Nome Certificato',
    'Certificate File': 'File Certificato',
    'Domain Names': 'Nomi Dominio',
    'Certificate Key': 'Chiave Certificato',
    'Meta Data': 'Metadati',
    'DNS Challenge': 'Sfida DNS',
    'Use DNS Challenge': 'Usa Sfida DNS',
    'Credentials': 'Credenziali',
    'Propagation Time (seconds)': 'Tempo di Propagazione (secondi)',
    
    /* WireGuard VPN Client UI */
    'Scan QR Code': 'Scansiona Codice QR',
    'Download Config File': 'Scarica File di Configurazione',
    'Show QR': 'Mostra QR',
    'Download Config': 'Scarica Configurazione',
    'Add Client': 'Aggiungi Client',
    'Confirm Deletion': 'Conferma Eliminazione',
    'No clients found. Add your first client above.': 'Nessun client trovato. Aggiungi il tuo primo client sopra.',
    'Error loading clients. Please try again later.': 'Errore nel caricamento dei client. Riprova più tardi.',
    'Transfer': 'Trasferimento',
    'QR Code library not loaded. Please refresh the page.': 'Libreria codice QR non caricata. Aggiorna la pagina.',
    'Failed to fetch client config': 'Impossibile recuperare la configurazione del client',
    'Received empty config': 'Configurazione ricevuta vuota',
    'Failed to generate QR code. Please try downloading the config file instead.': 'Impossibile generare il codice QR. Prova a scaricare il file di configurazione.',
    'WireGuard Client QR Code': 'Codice QR Client WireGuard',
    'Failed to load config': 'Impossibile caricare la configurazione',
    'Please try downloading the config file instead.': 'Prova a scaricare il file di configurazione.',
    
    /* WireGuard VPN Client Notifications */
    'Please enter a client name': 'Inserisci un nome client',
    'Client added successfully': 'Client aggiunto con successo',
    'Client deleted successfully': 'Client eliminato con successo',
    'Failed to create client. Please try again.': 'Impossibile creare il client. Riprova.',
    'Failed to delete client. Please try again.': 'Impossibile eliminare il client. Riprova.',
    'Error:': 'Errore:',
    'Are you sure you want to delete this certificate?': 'Sei sicuro di voler eliminare questo certificato?',
    'Save Services Configuration': 'Salva Configurazione Servizi',
    'Save User Preferences': 'Salva Preferenze Utente',
    'Services configuration saved successfully': 'Configurazione servizi salvata con successo',
    'User preferences saved successfully': 'Preferenze utente salvate con successo',
    'Failed to save services configuration': 'Impossibile salvare la configurazione dei servizi',
    'Failed to save user preferences': 'Impossibile salvare le preferenze utente',
    'Saving...': 'Salvataggio...',
    'Error fetching RTAD login attempts:': 'Errore nel recupero dei tentativi di accesso RTAD:',
    'Error fetching RTAD proxy events:': 'Errore nel recupero degli eventi proxy RTAD:',
    'NPM is not properly configured': 'NPM non è configurato correttamente',
    'NPM API endpoint not found': 'Endpoint API NPM non trovato',
    'Certificate is being issued. DNS validation may take a few minutes...': 'Il certificato è in fase di emissione. La validazione DNS potrebbe richiedere alcuni minuti...',
    'Certificate request submitted, but received a partial response. Check status in a few minutes.': 'Richiesta certificato inviata, ma ricevuta risposta parziale. Controlla lo stato tra qualche minuto.',
    'Certificate is processing... Please wait.': 'Certificato in elaborazione... Attendere.',
    'Status': 'Stato',
    
    // Audit log messages
    'No audit log data available': 'Nessun dato di log di audit disponibile',
    
    // Docker stats messages
    'No Docker containers found': 'Nessun container Docker trovato',
    'Error loading Docker containers': 'Errore nel caricamento dei container Docker',
};

export default translations; 