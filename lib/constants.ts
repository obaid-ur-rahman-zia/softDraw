import { Kalam } from "next/font/google";

interface AppProps {
    APP_NAME: string;
    APP_DOMAIN: string;
    APP_DESCRIPTION: string;
    APP_TITLE_DESCRIPTION: string;
}

export const APP: AppProps = {
    APP_NAME: "SoftDraw",
    APP_DOMAIN: "https://softdraw.site",
    APP_DESCRIPTION: "Softdraw is a virtual collaborative whiteboard tool that lets you easily sketch diagrams that have a hand-drawn feel to them.",
    APP_TITLE_DESCRIPTION: "Collaborative Whiteboard"
}


export const textFont = Kalam({
  subsets: ["latin"],
  weight: ["400"],
});