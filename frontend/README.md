# MoneyTrail Frontend Foundation

Build the initial frontend for a web application called MoneyTrail — AI Finance Controller.

MoneyTrail is a financial investigation and reconciliation platform for finance teams. It helps identify transaction/settlement discrepancies, organize financial exceptions, and later use AI to investigate and explain those exceptions.

For this first version, focus ONLY on creating a polished frontend UI. Do not implement backend APIs, authentication, database integration, payment processing, or AI functionality yet.

Create these main pages:

Dashboard

Transactions

Exceptions

Transaction Details / Investigation

Settings

The Dashboard should show:

Total Transactions

Reconciled Transactions

Open Exceptions

Total Amount at Risk

Recent exceptions

A simple chart showing exception categories

The Transactions page should contain a professional financial transaction table with fields such as:

Transaction ID

Date

Amount

Payment Status

Settlement Status

Reconciliation Status

The Exceptions page should show financial discrepancies with:

Transaction ID

Exception Type

Amount Difference

Severity

Status

Date

The Transaction Details page should be designed for future AI investigation. Show:

Transaction information

Payment details

Settlement details

Fees

Refund information

A transaction timeline

An "Investigate with AI" button

An area where the future AI investigation result will appear

Use realistic mock data for now.

Design requirements:

Modern fintech/enterprise dashboard

Clean and professional

Responsive

Easy to navigate

Strong visual hierarchy

Avoid excessive animations

Do not make it look like a generic AI chatbot

Make it look like a serious financial operations product

Use a consistent design system throughout the application

Use React and TypeScript if supported.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dd4f1dc4-f07a-4e95-acd3-37bdca037b98).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
