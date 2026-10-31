# 🔐 Secure RBAC Portal

### Role-Based Authentication & User Approval Management System

A secure web application that manages user registration, authentication, role-based access, and administrator approval workflows using **Next.js, TypeScript, Oracle Database, and PL/SQL**.

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Oracle-F80000?style=for-the-badge&logo=oracle&logoColor=white" alt="Oracle Database">
  <img src="https://img.shields.io/badge/PL%2FSQL-Database_Logic-orange?style=for-the-badge" alt="PL/SQL">
</p>

---

## ✨ Features

- 🔑 **User Authentication** — Registration and login functionality.
- 🛡️ **Role-Based Access Control (RBAC)** — Separate access permissions for Admin, HR, Manager, and Employee roles.
- ✅ **Admin Approval Workflow** — Administrators can approve or reject pending user registrations.
- 🗄️ **Oracle Database Integration** — Stores application data in Oracle Database.
- ⚙️ **PL/SQL Business Logic** — Uses database packages for key user-management operations.

## 🧰 Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | Web application and API routes |
| TypeScript | Application logic and type safety |
| Oracle Database | Persistent data storage |
| PL/SQL | Database operations and business logic |
| Node.js & npm | Application runtime and dependency management |

## 📁 Project Structure

```text
Secure Rbac Portal/
├── database/                 # Oracle SQL scripts and PL/SQL packages
├── web/
│   ├── app/                  # Pages and API routes
│   ├── lib/                  # Database and authentication utilities
│   ├── public/               # Static assets
│   ├── package.json          # Dependencies and scripts
│   └── package-lock.json     # Locked dependency versions
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- Oracle Database
- Oracle SQL Developer or another SQL client
- Git

### 1. Configure the Database

1. Create an Oracle database user for the application.
2. Run the SQL scripts in the `database/` folder in the intended order.
3. Configure the initial administrator account using the provided SQL script.

### 2. Configure the Application

Clone the repository and navigate to the application directory:

```bash
git clone https://github.com/YOUR-USERNAME/secure-rbac-portal.git
cd secure-rbac-portal/web
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file in the `web/` directory using `.env.example` as a reference. Configure your Oracle connection details and authentication secret.

**Never commit your actual `.env.local` file or credentials.**

### 3. Start the Application

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

## 🔒 Security Practices

- Keep database passwords and authentication secrets private.
- Exclude `.env.local` and other environment files from version control.
- Do not commit `node_modules/` or `.next/` generated files.
- Use appropriate role and permission checks for protected operations.

## 🎯 Project Objective

The goal of this project is to demonstrate secure authentication, role-based authorization, database-driven business logic, and user approval workflows in a modern web application.

---

<p align="center">
  <b>Secure RBAC Portal</b><br>
  Built with Next.js, TypeScript, Oracle Database & PL/SQL
</p>