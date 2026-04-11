# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Backblaze B2 Upload Setup (Backend)

This frontend uses a backend presign flow for nurse document uploads:

1. `POST /media/b2/upload/presign` (backend returns presigned upload target)
2. Upload file directly to object storage using returned URL/fields
3. `POST /nurses/add/documents` with `nurseId`, `documentType`, `objectKey`, `mediaId`

### Important

- Keep B2 credentials on the backend only.
- Never commit real keys to this repository.
- `B2_REGION` must match `B2_S3_ENDPOINT` bucket region exactly.

Use `.env.example` as the template for backend environment variables.
