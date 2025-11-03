# Migration from MongoDB to MySQL

## Completed Tasks
- [x] Install Sequelize and mysql2 packages
- [x] Create new MySQL config file (mysql.js) with Sequelize connection to "notes" database
- [x] Convert Mongoose models to Sequelize models (Note, User, Blog, Task, Collab)
- [x] Update all routes to use Sequelize queries instead of Mongoose
- [x] Update server.js to connect to MySQL instead of MongoDB

## Pending Tasks
- [x] Test the connection and ensure all CRUD operations work
- [x] Handle data migration if existing data needs to be transferred (No existing MongoDB data to migrate - MongoDB not running)
