// the app's client id for the phila.gov API gateway - one id covers databridge,
// AIS search, and AIS autocomplete. Only the local dev server sends it: the gateway
// injects the id itself for requests from the deployed origins, and it can't do that
// for localhost, which every app shares. Undefined in any build, so call sites omit
// the client_id param entirely
export const GATEWAY_CLIENT_ID = import.meta.env.DEV ? import.meta.env.VITE_GATEWAY_CLIENT_ID : undefined;
