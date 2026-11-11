import { router } from "expo-router";

export const volver = () => (router.canGoBack() ? router.back() : router.replace("/"));
