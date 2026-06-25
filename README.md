# VOID Store

Loja streetwear em HTML, CSS e JavaScript puro, com Firebase Authentication e Firestore.

## O que esta versão já tem

- Layout premium responsivo.
- Login real com Firebase Authentication.
- Cadastro de cliente.
- Recuperação de senha.
- Proteção do `admin.html` para o email administrador.
- Painel admin para cadastrar, editar e excluir produtos.
- Produtos carregados do Firestore.
- Página de produto por ID.
- Carrinho com `localStorage`.
- Favoritos com `localStorage`.
- Checkout criando pedidos no Firestore.
- Perfil com pedidos do usuário logado.
- Lista de pedidos no admin.

## Configuração obrigatória do Firebase

Abra `firebase-config.js` e substitua os valores:

```js
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

Depois confira o admin:

```js
export const ADMIN_EMAIL = "briangabrielfsoares@gmail.com";
```

Esse email precisa ser igual ao email criado em Authentication > Users.

## Regras recomendadas do Firestore

Cole estas regras no Firebase Console > Firestore Database > Rules:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn() && request.auth.token.email == "briangabrielfsoares@gmail.com";
    }

    match /products/{productId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    match /orders/{orderId} {
      allow create: if true;
      allow read: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
      allow update, delete: if isAdmin();
    }
  }
}
```

## Como publicar pelo GitHub

1. Substitua os arquivos do repositório pelos arquivos desta versão.
2. No GitHub, clique em **Commit changes**.
3. A Vercel vai publicar automaticamente.
4. Abra `/login.html`, entre como admin e acesse `/admin.html`.
5. No admin, cadastre produtos ou clique em **Criar produtos exemplo no Firestore**.

## Próximas integrações para ficar 100%

- Pagamento real PIX/cartão com Mercado Pago, Stripe ou outra plataforma.
- Upload de imagens com Firebase Storage ou Cloudinary.
- Cálculo real de frete.
- Emails automáticos de pedido.
