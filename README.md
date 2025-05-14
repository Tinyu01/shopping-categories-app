# Shopping Categories Web Application

This is a simple web application for managing shopping categories with a hierarchical structure and optional descriptions. It uses a Node.js backend with Express and SQLite, and a frontend with basic HTML and vanilla JavaScript.

## Features
- Display hierarchical shopping categories.
- Add new categories with optional parent and description.
- Update and delete categories (with restrictions for deletion).

## Setup
1. Clone this repository.
2. Navigate to the `backend` directory.
3. Run `npm install` to install dependencies.
4. Run `node server.js` to start the server.
5. Open `frontend/index.html` in your browser.

## Database
The application uses SQLite with a single `categories` table:
- `id`: Integer, primary key
- `name`: String, required
- `parentId`: Integer, nullable (for hierarchy)
- `description`: Text, nullable

## API Endpoints
- `GET /categories`: Retrieve all categories
- `POST /categories`: Add a new category
- `PUT /categories/:id`: Update an existing category
- `DELETE /categories/:id`: Delete a category (if no children)

## Future Improvements
- Implement authentication.
- Add search functionality.
- Enhance frontend for update and delete operations.