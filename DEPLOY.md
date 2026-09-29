# Deployment and Environment Setup

## Prerequisites
*   Node.js v20+
*   PostgreSQL v15+ (Local or Cloud)
*   Git

## Environment Setup
1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/candlestixxx/aicrm.git
    cd aicrm
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root directory. **Never commit this file.**
    ```env
    # Database Connection String
    DATABASE_URL="postgresql://user:password@localhost:5432/aicrm_db?schema=public"

    # Encryption Secret for API Vault (Must be a strong, 32+ character string)
    ENCRYPTION_SECRET="your-very-strong-secret-key-that-is-at-least-32-chars-long"
    ```

4.  **Database Initialization:**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

## Running the Application
*   **Development:**
    ```bash
    npm run dev
    ```
    The application will run at `http://localhost:3000`.

*   **Production Build:**
    ```bash
    npm run build
    npm start
    ```

## Submodule Management (If applicable in the future)
If submodules are added, initialize and update them recursively:
```bash
git submodule update --init --recursive
```