export const FB_SCOPES = [
    "pages_manage_posts",
    "pages_read_engagement",
    "pages_show_list",
    "public_profile",
    "email",
].join(",");

export async function getFacebookPages(userAccessToken: string) {
    try {
        const response = await fetch(
            `https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}&fields=id,name,access_token,picture{url}`
        );
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Failed to fetch FB pages:", error);
        throw error;
    }
}

export async function getLongLivedToken(shortLivedToken: string) {
    try {
        const response = await fetch(
            `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FB_APP_ID}&client_secret=${process.env.FB_APP_SECRET}&fb_exchange_token=${shortLivedToken}`
        );
        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error("Failed to exchange token:", error);
        return null;
    }
}
