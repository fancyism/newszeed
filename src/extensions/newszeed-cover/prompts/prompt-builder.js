/**
 * Newszeed Cover Generator - Prompt Builder
 * Generates optimized prompts for different news categories
 */

// ============================================
// Category Prompt Templates
// ============================================

const categoryTemplates = {
    politics: {
        systemPrompt: `You are an expert AI Art Director and Image Generator. Your task is to generate professional news cover images for world politics news in Thai style.`,

        generatePrompt: (payload) => {
            const { headline, images, aspectRatio, fontStyles, textPosition, mood } = payload;

            let prompt = `Create a professional Thai news cover image for WORLD POLITICS news.

COMPOSITION:
- Professional news broadcast style
- Dark blue/gray gradient background with subtle world map overlay
- Clean, authoritative layout suitable for Thai news media

IMAGES PROVIDED:
${images.length} reference images of political figures/leaders provided.
- Arrange them in a professional composition (side-by-side or overlapping circles)
- Add subtle flag overlays or national symbols if identifiable

`;

            if (headline) {
                prompt += `HEADLINE TEXT (THAI):
"${headline}"
- Position: ${getPositionDesc(textPosition)}
- Style: ${getFontStyleDesc(fontStyles)}
- Use bold, impactful Thai typography
- Add text shadow/glow for readability
- White or light colored text on dark background

`;
            }

            prompt += `ASPECT RATIO: ${aspectRatio}

STYLE REQUIREMENTS:
- Professional broadcast news quality
- Glassmorphism elements for modern look
- Subtle gradient overlays
- "BREAKING NEWS" style banner if appropriate
- NO cartoonish or AI-generated looking elements
- Photo-realistic compositing

`;

            if (mood && mood !== 'none') {
                prompt += `MOOD/EXPRESSION: The subjects should appear ${getMoodDesc(mood)}

`;
            }

            prompt += `OUTPUT: High-quality, publication-ready news cover image that looks professionally designed.`;

            return prompt;
        }
    },

    breaking: {
        systemPrompt: `You are an expert AI Art Director specializing in urgent breaking news graphics.`,

        generatePrompt: (payload) => {
            const { headline, images, aspectRatio, fontStyles, textPosition } = payload;

            return `Create an URGENT BREAKING NEWS cover image.

COMPOSITION:
- Red and dark gradient background
- Bold "ข่าวด่วน" or "BREAKING" banner at top
- Dramatic, attention-grabbing layout
- Flashing/alert style visual elements

IMAGES: ${images.length} reference images provided.
- Dramatic presentation of subjects
- High contrast treatment

${headline ? `HEADLINE: "${headline}"
- Position: ${getPositionDesc(textPosition)}
- Style: ${getFontStyleDesc(fontStyles)}
- URGENT, bold typography
- Red/white color scheme` : ''}

ASPECT RATIO: ${aspectRatio}

OUTPUT: Urgent, broadcast-quality breaking news graphic.`;
        }
    },

    finance: {
        systemPrompt: `You are an expert financial news graphic designer.`,

        generatePrompt: (payload) => {
            const { headline, images, aspectRatio, fontStyles, textPosition } = payload;

            return `Create a FINANCIAL NEWS cover image.

COMPOSITION:
- Professional dark blue/green gradient
- Stock chart or financial graph elements in background
- Clean, corporate style layout
- Currency symbols or market indicators

IMAGES: ${images.length} reference images provided.
- Professional headshot style arrangements
- Business/corporate feel

${headline ? `HEADLINE: "${headline}"
- Position: ${getPositionDesc(textPosition)}
- Style: ${getFontStyleDesc(fontStyles)}
- Include percentage indicators if relevant (▲ ▼)
- Green for positive, red for negative` : ''}

ASPECT RATIO: ${aspectRatio}

OUTPUT: Professional financial news broadcast quality image.`;
        }
    },

    football: {
        systemPrompt: `You are an expert sports graphic designer specializing in football/soccer.`,

        generatePrompt: (payload) => {
            const { headline, images, aspectRatio, fontStyles, textPosition } = payload;

            return `Create a FOOTBALL NEWS cover image.

COMPOSITION:
- Dynamic, energetic sports style
- Stadium/pitch background elements
- Team colors and crests if identifiable
- Action-ready, dramatic lighting

IMAGES: ${images.length} reference images provided.
- Dynamic player poses
- Club badge overlays

${headline ? `HEADLINE: "${headline}"
- Position: ${getPositionDesc(textPosition)}
- Style: ${getFontStyleDesc(fontStyles)}
- Bold sports typography
- Include score if relevant` : ''}

ASPECT RATIO: ${aspectRatio}

OUTPUT: ESPN/Sky Sports quality football news graphic.`;
        }
    },

    transfer: {
        systemPrompt: `You are a transfer news graphic specialist in the style of Fabrizio Romano.`,

        generatePrompt: (payload) => {
            const { headline, images, aspectRatio, fontStyles, textPosition } = payload;

            return `Create a TRANSFER NEWS cover in FABRIZIO ROMANO "HERE WE GO!" style.

COMPOSITION:
- "HERE WE GO! ✅" banner prominently displayed
- Player in new team's jersey (photorealistic)
- Club crests showing transfer: [OLD CLUB] → [NEW CLUB]
- Arrow or direction indicator between clubs
- Confirmation checkmark styling
- Green/white success colors

IMAGES: ${images.length} reference images provided.
- Player wearing new team colors
- Both club badges clearly visible

${headline ? `HEADLINE: "${headline}"
- Position: ${getPositionDesc(textPosition)}
- Style: ${getFontStyleDesc(fontStyles)}
- Transfer confirmation style
- Include fee if mentioned` : ''}

ASPECT RATIO: ${aspectRatio}

OUTPUT: Viral transfer announcement graphic like Fabrizio Romano's posts.`;
        }
    },

    drama: {
        systemPrompt: `You are a Thai drama/gossip news graphic designer.`,

        generatePrompt: (payload) => {
            const { headline, images, aspectRatio, fontStyles, textPosition, mood } = payload;

            return `Create a THAI DRAMA NEWS cover image.

COMPOSITION:
- Dramatic, tabloid-style layout
- Hot pink/red accent colors
- Social media reaction elements
- Emotional, attention-grabbing design

IMAGES: ${images.length} reference images provided.
- Dramatic expressions if possible
- Tabloid-style arrangement

${headline ? `HEADLINE: "${headline}"
- Position: ${getPositionDesc(textPosition)}
- Style: ${getFontStyleDesc(fontStyles)}
- Dramatic Thai news typography
- Use !! or ??? for emphasis` : ''}

${mood && mood !== 'none' ? `MOOD: ${getMoodDesc(mood)}` : ''}

ASPECT RATIO: ${aspectRatio}

OUTPUT: Thai tabloid/drama news style cover that drives engagement.`;
        }
    },

    honkrasae: {
        systemPrompt: `You are a Thai TV talk show graphic designer for "โหนกระแส" style.`,

        generatePrompt: (payload) => {
            const { headline, images, aspectRatio, fontStyles, textPosition } = payload;

            return `Create a "โหนกระแส" TV SHOW style cover.

COMPOSITION:
- TV studio background feel
- Talk show panel/interview style
- Quote bubbles or speech elements
- Professional Thai TV broadcast style
- "โหนกระแส" branding feel

IMAGES: ${images.length} reference images provided.
- Arrange as TV show guests
- Interview/debate positioning

${headline ? `HEADLINE: "${headline}"
- Position: ${getPositionDesc(textPosition)}
- Style: ${getFontStyleDesc(fontStyles)}
- TV show topic/title style
- Quote marks if applicable` : ''}

ASPECT RATIO: ${aspectRatio}

OUTPUT: Thai TV talk show promotional graphic.`;
        }
    },

    esports: {
        systemPrompt: `You are an esports and gaming content graphic designer.`,

        generatePrompt: (payload) => {
            const { headline, images, aspectRatio, fontStyles, textPosition } = payload;

            return `Create an ESPORTS/GAMING NEWS cover image.

COMPOSITION:
- Neon/cyberpunk color scheme
- Gaming/streaming aesthetic
- RGB lighting effects
- Subscriber/view counts styling
- Game logos if identifiable

IMAGES: ${images.length} reference images provided.
- Streaming/gaming personality style
- Neon glow effects on subjects

${headline ? `HEADLINE: "${headline}"
- Position: ${getPositionDesc(textPosition)}
- Style: ${getFontStyleDesc(fontStyles)}
- Gaming/tech typography
- Neon glow effects` : ''}

ASPECT RATIO: ${aspectRatio}

OUTPUT: YouTube thumbnail / esports news quality image.`;
        }
    },

    health: {
        systemPrompt: `You are a medical and health news graphic designer.`,

        generatePrompt: (payload) => {
            const { headline, images, aspectRatio, fontStyles, textPosition } = payload;

            return `Create a HEALTH/RESEARCH NEWS cover image.

COMPOSITION:
- Clean, medical/scientific style
- Light blue/white/green colors (trust colors)
- DNA helix or medical symbols if relevant
- Research paper citation style elements
- Infographic quality

IMAGES: ${images.length} reference images provided.
- Professional medical/scientist presentation
- Clean, trustworthy arrangement

${headline ? `HEADLINE: "${headline}"
- Position: ${getPositionDesc(textPosition)}
- Style: ${getFontStyleDesc(fontStyles)}
- Scientific/medical typography
- Clean and readable` : ''}

ASPECT RATIO: ${aspectRatio}

OUTPUT: Medical journal / health news publication quality.`;
        }
    },

    celebrity: {
        systemPrompt: `You are an entertainment and celebrity news graphic designer.`,

        generatePrompt: (payload) => {
            const { headline, images, aspectRatio, fontStyles, textPosition } = payload;

            return `Create a CELEBRITY NEWS cover image.

COMPOSITION:
- Glamorous, entertainment style
- Gold/pink/sparkle accents
- Red carpet or spotlight effects
- Paparazzi/magazine style
- Star ratings or reaction elements

IMAGES: ${images.length} reference images provided.
- Glamour shot styling
- Entertainment magazine layout

${headline ? `HEADLINE: "${headline}"
- Position: ${getPositionDesc(textPosition)}
- Style: ${getFontStyleDesc(fontStyles)}
- Entertainment magazine typography
- Eye-catching styling` : ''}

ASPECT RATIO: ${aspectRatio}

OUTPUT: Entertainment magazine cover quality image.`;
        }
    },
};

// ============================================
// Helper Functions
// ============================================

function getPositionDesc(position) {
    const positions = {
        'top-left': 'top left corner',
        'top': 'top center',
        'top-right': 'top right corner',
        'left': 'left side, vertically centered',
        'center': 'center of the image',
        'right': 'right side, vertically centered',
        'bottom-left': 'bottom left corner',
        'bottom': 'bottom center',
        'bottom-right': 'bottom right corner',
    };
    return positions[position] || 'bottom center';
}

function getFontStyleDesc(fontStyles) {
    const styles = {
        '3d': '3D extruded text with depth and shadow',
        'thai-bold': 'Bold Thai news header font',
        'bold': 'Bold, heavy weight',
        'thin': 'Thin, elegant weight',
        'italic': 'Italic/slanted',
        'news-thai': 'Traditional Thai news font style',
    };

    return fontStyles.map(s => styles[s] || s).join(', ');
}

function getMoodDesc(mood) {
    const moods = {
        'smile': 'smiling, happy, friendly',
        'serious': 'serious, professional, stern',
        'sad': 'sad, disappointed, upset',
        'angry': 'angry, frustrated, intense',
        'shocked': 'shocked, surprised, alarmed',
        'confident': 'confident, powerful, self-assured',
    };
    return moods[mood] || '';
}

// ============================================
// Main Export
// ============================================

/**
 * Build a complete prompt for Gemini based on payload
 * @param {Object} payload 
 * @returns {Object} { systemPrompt, userPrompt }
 */
export function buildPrompt(payload) {
    const template = categoryTemplates[payload.category];

    if (!template) {
        throw new Error(`Unknown category: ${payload.category}`);
    }

    return {
        systemPrompt: template.systemPrompt,
        userPrompt: template.generatePrompt(payload),
    };
}

/**
 * Get available categories
 * @returns {string[]}
 */
export function getCategories() {
    return Object.keys(categoryTemplates);
}
