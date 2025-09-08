import { Kalam, Sacramento } from "next/font/google";

interface AppProps {
    APP_NAME: string;
    APP_DOMAIN: string;
}

export const APP: AppProps = {
    APP_NAME: "SoftDraw",
    APP_DOMAIN: "https://localhost:3000/"
}


export const textFont = Kalam({
  subsets: ["latin"],
  weight: ["400"],
});