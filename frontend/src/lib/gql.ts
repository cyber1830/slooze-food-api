import { gql } from '@apollo/client';

const ORDER_FIELDS = gql`
  fragment OrderFields on Order {
    id status country total createdAt
    user { id name }
    restaurant { id name }
    paymentMethod { id label }
    items { id quantity unitPrice menuItem { id name } }
  }
`;

export const LOGIN = gql`mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) { accessToken user { id name email role country } } }`;
export const ME = gql`query Me { me { id name email role country } }`;
export const RESTAURANTS = gql`query Restaurants { restaurants { id name cuisine country menuItems { id name description price } } }`;
export const CART = gql`query Cart { myCart { ...OrderFields } } ${ORDER_FIELDS}`;
export const ORDERS = gql`query Orders { orders { ...OrderFields } } ${ORDER_FIELDS}`;
export const CHANGE_CART_ITEM = gql`mutation ChangeCartItem($menuItemId: ID!, $delta: Int!) { changeCartItem(menuItemId: $menuItemId, delta: $delta) { ...OrderFields } } ${ORDER_FIELDS}`;
export const PLACE_ORDER = gql`mutation PlaceOrder($orderId: ID!, $paymentMethodId: ID!) { placeOrder(orderId: $orderId, paymentMethodId: $paymentMethodId) { ...OrderFields } } ${ORDER_FIELDS}`;
export const CANCEL_ORDER = gql`mutation CancelOrder($orderId: ID!) { cancelOrder(orderId: $orderId) { ...OrderFields } } ${ORDER_FIELDS}`;
export const PAYMENT_METHODS = gql`query PaymentMethods { paymentMethods { id type label last4 isDefault } }`;
export const ADD_PAYMENT_METHOD = gql`mutation AddPaymentMethod($input: PaymentMethodInput!) { addPaymentMethod(input: $input) { id } }`;
export const UPDATE_PAYMENT_METHOD = gql`mutation UpdatePaymentMethod($id: ID!, $input: UpdatePaymentMethodInput!) { updatePaymentMethod(id: $id, input: $input) { id } }`;
