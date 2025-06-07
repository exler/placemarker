# Pocketbase Setup for Placemarker

## Collection Schema

You need to create a collection called `country_selections` in your Pocketbase admin panel (http://localhost:8090/_/) with the following schema:

### Collection Name: `country_selections`

### Fields:

1. **user** (Relation)
   - Type: `Relation`
   - Related collection: `users`
   - Relation type: `Many to One`
   - Required: `true`
   - Index: `true`

2. **country_alpha3** (Text)
   - Type: `Text`
   - Required: `true`
   - Max length: `3`
   - Pattern: `^[A-Z]{3}$` (optional validation)
   - Description: `ISO 3166-1 alpha-3 country code (e.g., "USA", "GBR", "FRA")`

### API Rules:

#### List/Search Rule:
```javascript
@request.auth.id != "" && user = @request.auth.id
```

#### View Rule:
```javascript
@request.auth.id != "" && user = @request.auth.id
```

#### Create Rule:
```javascript
@request.auth.id != "" && user = @request.auth.id
```

#### Update Rule:
```javascript
@request.auth.id != "" && user = @request.auth.id
```

#### Delete Rule:
```javascript
@request.auth.id != "" && user = @request.auth.id
```

### Indexes (Optional but recommended):

1. **user_country_unique**
   - Fields: `user`, `country_alpha3`
   - Unique: `true`
   - This prevents duplicate country selections per user

## Setup Steps:

1. Start your Pocketbase container:
   ```bash
   docker-compose up -d
   ```

2. Go to the admin panel: http://localhost:8090/_/

3. Create an admin account if you haven't already

4. Go to "Collections" and click "New Collection"

5. Create the `country_selections` collection with the schema above

6. Set the API rules as specified above

7. (Optional) Create some test user accounts for testing

## Schema Benefits:

- **Reduced Storage**: Only stores essential ISO3 country codes (3 characters per record)
- **Data Consistency**: Country names and ISO2 codes are derived from the reliable `i18n-iso-countries` library
- **Internationalization Ready**: Country names can be dynamically translated to different languages
- **Maintenance Free**: No need to update stored country names when they change politically

## Authentication Flow:

1. Users can use the app without authentication (data stored locally in IndexedDB)
2. When users sign in, their local selections are synced to Pocketbase
3. Country selections are automatically saved to both IndexedDB and Pocketbase when authenticated
4. When signing in from a different device, selections are loaded from Pocketbase

## Session Management:

- **Remember Me = false**: Session expires when browser closes
- **Remember Me = true**: Session persists for 30 days (default Pocketbase behavior)

## Security Features:

- All API rules ensure users can only access their own data
- Authentication is handled securely through Pocketbase
- Local data is preserved even when not authenticated
