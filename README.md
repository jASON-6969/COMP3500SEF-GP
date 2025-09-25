# Group 28 COMP3500SEF-GP
COMP3500SEF group project

# Distributed Inventory and Sales Management System
## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 14.0 or higher)
- **npm** (comes with Node.js) or **yarn**

You can check your versions by running:
```bash
node --version
npm --version
```

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone https://github.com/jASON-6969/COMP3500SEF-GP.git
   ```

2. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

   This will install all required packages including:
   - Vue.js 3
   - Vuetify 3
   - Material Design Icons
   - Vue CLI service


##change .env.local.delete into .env.local

## Development

### Start the development server

```bash
cd frontend
npm run dev
```

or

```bash
cd frontend
npm run serve
```

The application will be available at `http://localhost:8080` and will automatically reload when you make changes to the source files.

## Technology Stack

- **Frontend Framework**: Vue.js 3
- **UI Framework**: Vuetify 3
- **Icons**: Material Design Icons
- **Build Tool**: Vue CLI
- **Package Manager**: npm

### Common Issues

1. **Port already in use**: If port 8080 is busy, Vue CLI will automatically use the next available port
2. **Node version issues**: Ensure you're using Node.js 14.0 or higher
3. **Dependencies issues**: Try deleting `node_modules` and running `npm install` again

## License

This project is licensed under the MIT License.

