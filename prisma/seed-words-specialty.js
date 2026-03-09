// Seed Specialty Expanded Vocabulary (100 words) — Phase 12.1
// Topics: Advanced Trading, Crypto, AI/ML
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const words = [
    // ── Advanced Trading (40) ────────────────────────────────────────────────────
    {
        english: "candlestick",
        vietnamese: "nến (biểu đồ)",
        definition: "A type of price chart showing open, high, low, close.",
        exampleSentence:
            "A red candlestick means the price closed lower than it opened.",
        level: "B2",
        tags: "trading,technical-analysis",
    },
    {
        english: "resistance",
        vietnamese: "vùng kháng cự",
        definition: "A price level where selling pressure tends to be strong.",
        exampleSentence:
            "Bitcoin failed to break through the $70,000 resistance.",
        level: "B2",
        tags: "trading,technical-analysis",
    },
    {
        english: "support",
        vietnamese: "vùng hỗ trợ",
        definition:
            "A price level where buying pressure tends to stop a decline.",
        exampleSentence: "The stock bounced off a key support level.",
        level: "B2",
        tags: "trading,technical-analysis",
    },
    {
        english: "breakout",
        vietnamese: "bứt phá khỏi vùng giá",
        definition:
            "When a price moves beyond a defined support or resistance level.",
        exampleSentence: "The breakout above $50 triggered a strong rally.",
        level: "B2",
        tags: "trading,technical-analysis",
    },
    {
        english: "pullback",
        vietnamese: "điều chỉnh giảm nhẹ",
        definition: "A temporary reversal in the direction of a trend.",
        exampleSentence: "Traders bought the pullback after the initial surge.",
        level: "B2",
        tags: "trading",
    },
    {
        english: "momentum",
        vietnamese: "đà / sức mạnh xu hướng",
        definition: "The rate of price change, indicating strength of a trend.",
        exampleSentence: "The bullish momentum is strong — prices keep rising.",
        level: "B2",
        tags: "trading,technical-analysis",
    },
    {
        english: "divergence",
        vietnamese: "phân kỳ",
        definition: "When price and an indicator move in opposite directions.",
        exampleSentence: "RSI divergence can signal a trend reversal.",
        level: "B2",
        tags: "trading,technical-analysis",
    },
    {
        english: "confluence",
        vietnamese: "hội tụ tín hiệu",
        definition:
            "When multiple signals or levels align to strengthen a trade.",
        exampleSentence:
            "Buy when there's a confluence of support and indicator signals.",
        level: "B2",
        tags: "trading",
    },
    {
        english: "Fibonacci retracement",
        vietnamese: "Fibonacci hồi phục",
        definition:
            "Using Fibonacci levels to predict support/resistance areas.",
        exampleSentence:
            "Price often reverses at the 61.8% Fibonacci retracement.",
        level: "B2",
        tags: "trading,technical-analysis",
    },
    {
        english: "scalping",
        vietnamese: "lướt sóng / scalp",
        definition: "A trading strategy making many small profits quickly.",
        exampleSentence: "Scalping requires fast execution and tight spreads.",
        level: "B2",
        tags: "trading",
    },
    {
        english: "swing trading",
        vietnamese: "giao dịch theo sóng",
        definition:
            "Holding positions for days or weeks to profit from swings.",
        exampleSentence: "Swing trading is less stressful than day trading.",
        level: "B2",
        tags: "trading",
    },
    {
        english: "trend line",
        vietnamese: "đường xu hướng",
        definition:
            "A line on a chart connecting highs or lows to show direction.",
        exampleSentence: "The trend line was broken, signaling a reversal.",
        level: "B2",
        tags: "trading,technical-analysis",
    },
    {
        english: "moving average",
        vietnamese: "đường trung bình động",
        definition: "An average price over a specified time period.",
        exampleSentence: "The 200-day moving average is a key indicator.",
        level: "B2",
        tags: "trading,technical-analysis",
    },
    {
        english: "Bollinger Bands",
        vietnamese: "Dải Bollinger",
        definition: "Bands that show volatility around a moving average.",
        exampleSentence:
            "Price touching the upper Bollinger Band can signal overbought.",
        level: "B2",
        tags: "trading,technical-analysis",
    },
    {
        english: "RSI",
        vietnamese: "chỉ số sức mạnh tương đối (RSI)",
        definition:
            "Relative Strength Index — measures speed and change of price movements.",
        exampleSentence: "An RSI above 70 suggests a stock is overbought.",
        level: "B2",
        tags: "trading,technical-analysis",
    },
    {
        english: "MACD",
        vietnamese: "chỉ báo hội tụ/phân kỳ đường trung bình (MACD)",
        definition:
            "Moving Average Convergence Divergence — a momentum indicator.",
        exampleSentence: "A MACD crossover can signal a buy or sell.",
        level: "B2",
        tags: "trading,technical-analysis",
    },
    {
        english: "volume",
        vietnamese: "khối lượng giao dịch",
        definition: "The number of shares or coins traded in a period.",
        exampleSentence: "High volume confirms the strength of a breakout.",
        level: "B1",
        tags: "trading",
    },
    {
        english: "order flow",
        vietnamese: "dòng lệnh",
        definition: "The buying and selling orders entering the market.",
        exampleSentence:
            "Institutional order flow drives major price movements.",
        level: "B2",
        tags: "trading",
    },
    {
        english: "liquidity zone",
        vietnamese: "vùng thanh khoản",
        definition: "Price areas with high concentration of buy/sell orders.",
        exampleSentence:
            "Price often returns to liquidity zones before continuing.",
        level: "B2",
        tags: "trading",
    },
    {
        english: "stop loss",
        vietnamese: "lệnh cắt lỗ",
        definition: "An order to sell when price falls to a specified level.",
        exampleSentence: "Always set a stop loss to protect your capital.",
        level: "B1",
        tags: "trading",
    },
    {
        english: "take profit",
        vietnamese: "chốt lời",
        definition:
            "An order that closes a position when it reaches a profit target.",
        exampleSentence: "Set your take profit before entering a trade.",
        level: "B1",
        tags: "trading",
    },
    {
        english: "risk/reward ratio",
        vietnamese: "tỷ lệ rủi ro/lợi nhuận",
        definition: "Compares potential loss to potential profit of a trade.",
        exampleSentence: "A 1:3 risk/reward ratio is favorable.",
        level: "B2",
        tags: "trading",
    },
    {
        english: "long position",
        vietnamese: "vị thế mua (long)",
        definition: "Buying an asset expecting the price to rise.",
        exampleSentence: "He opened a long position on ETH at $3,000.",
        level: "B1",
        tags: "trading",
    },
    {
        english: "short position",
        vietnamese: "vị thế bán (short)",
        definition: "Borrowing and selling an asset expecting it to fall.",
        exampleSentence: "She made profit by shorting the overvalued stock.",
        level: "B2",
        tags: "trading",
    },
    {
        english: "overbought",
        vietnamese: "quá mua",
        definition:
            "When a price has risen too high and a reversal may be due.",
        exampleSentence: "RSI above 80 suggests the market is overbought.",
        level: "B2",
        tags: "trading,technical-analysis",
    },
    {
        english: "oversold",
        vietnamese: "quá bán",
        definition:
            "When a price has fallen too low and a recovery may be due.",
        exampleSentence: "The coin looks oversold after a 40% drop.",
        level: "B2",
        tags: "trading,technical-analysis",
    },
    {
        english: "bear market",
        vietnamese: "thị trường gấu (đang giảm)",
        definition: "A market with falling prices, typically 20%+ decline.",
        exampleSentence: "Crypto entered a bear market in 2022.",
        level: "B1",
        tags: "trading",
    },
    {
        english: "bull market",
        vietnamese: "thị trường bò (đang tăng)",
        definition: "A market with rising prices and positive sentiment.",
        exampleSentence: "We are in a bull market — everything is going up.",
        level: "B1",
        tags: "trading",
    },
    {
        english: "margin call",
        vietnamese: "yêu cầu nộp thêm ký quỹ",
        definition:
            "A demand to add funds when account value falls below minimum.",
        exampleSentence: "He received a margin call after the sudden crash.",
        level: "B2",
        tags: "trading",
    },
    {
        english: "leverage",
        vietnamese: "đòn bẩy",
        definition: "Using borrowed funds to increase potential returns.",
        exampleSentence:
            "Trading with 10x leverage amplifies both gains and losses.",
        level: "B2",
        tags: "trading",
    },
    {
        english: "liquidation",
        vietnamese: "thanh lý / bị liquidate",
        definition: "Forced closing of a position when margin is insufficient.",
        exampleSentence: "Many traders were liquidated during the flash crash.",
        level: "B2",
        tags: "trading,crypto",
    },
    {
        english: "derivatives",
        vietnamese: "công cụ phái sinh",
        definition:
            "Financial contracts that derive value from an underlying asset.",
        exampleSentence: "Futures and options are common derivatives.",
        level: "B2",
        tags: "trading,finance",
    },
    {
        english: "futures contract",
        vietnamese: "hợp đồng tương lai",
        definition: "An agreement to buy or sell at a future date and price.",
        exampleSentence:
            "Bitcoin futures allow speculation without owning BTC.",
        level: "B2",
        tags: "trading,finance",
    },
    {
        english: "options contract",
        vietnamese: "hợp đồng quyền chọn",
        definition:
            "A contract giving the right but not obligation to buy/sell.",
        exampleSentence:
            "She bought call options as a hedge against the rally.",
        level: "B2",
        tags: "trading,finance",
    },
    {
        english: "bid/ask spread",
        vietnamese: "chênh lệch giá mua/bán",
        definition: "The difference between buying and selling prices.",
        exampleSentence: "A narrow bid-ask spread indicates high liquidity.",
        level: "B2",
        tags: "trading",
    },
    {
        english: "depth of market",
        vietnamese: "độ sâu thị trường",
        definition:
            "Shows the number of open buy/sell orders at different prices.",
        exampleSentence:
            "Check the depth of market before entering large positions.",
        level: "B2",
        tags: "trading",
    },
    {
        english: "slippage",
        vietnamese: "trượt giá",
        definition:
            "The difference between expected and actual execution price.",
        exampleSentence: "Slippage is higher during low-liquidity periods.",
        level: "B2",
        tags: "trading",
    },
    {
        english: "portfolio rebalancing",
        vietnamese: "tái cân bằng danh mục",
        definition: "Adjusting the proportion of assets in a portfolio.",
        exampleSentence: "Rebalancing quarterly keeps risk in check.",
        level: "B2",
        tags: "trading,investment",
    },
    {
        english: "market sentiment",
        vietnamese: "tâm lý thị trường",
        definition: "The overall attitude of investors toward the market.",
        exampleSentence: "Market sentiment turned bearish after the news.",
        level: "B2",
        tags: "trading",
    },

    // ── Crypto-specific (30) ─────────────────────────────────────────────────────
    {
        english: "decentralized",
        vietnamese: "phi tập trung",
        definition: "Not controlled by a single authority.",
        exampleSentence: "Bitcoin is a decentralized digital currency.",
        level: "B2",
        tags: "crypto",
    },
    {
        english: "smart contract",
        vietnamese: "hợp đồng thông minh",
        definition: "Self-executing code on a blockchain.",
        exampleSentence: "Smart contracts run DeFi protocols automatically.",
        level: "B2",
        tags: "crypto",
    },
    {
        english: "gas fee",
        vietnamese: "phí gas",
        definition: "A fee paid to process a transaction on the blockchain.",
        exampleSentence:
            "Gas fees on Ethereum can be very high during congestion.",
        level: "B2",
        tags: "crypto",
    },
    {
        english: "seed phrase",
        vietnamese: "cụm từ khôi phục ví",
        definition: "12 or 24 random words used to recover a crypto wallet.",
        exampleSentence: "Never share your seed phrase with anyone.",
        level: "B2",
        tags: "crypto",
    },
    {
        english: "altcoin",
        vietnamese: "đồng tiền thay thế",
        definition: "Any cryptocurrency other than Bitcoin.",
        exampleSentence: "Ethereum and Solana are popular altcoins.",
        level: "B1",
        tags: "crypto",
    },
    {
        english: "stablecoin",
        vietnamese: "đồng tiền ổn định giá",
        definition: "A cryptocurrency pegged to a stable asset like USD.",
        exampleSentence: "USDT is the most widely used stablecoin.",
        level: "B1",
        tags: "crypto",
    },
    {
        english: "DeFi",
        vietnamese: "tài chính phi tập trung",
        definition:
            "Financial services using blockchain, without intermediaries.",
        exampleSentence:
            "DeFi platforms allow lending and borrowing with crypto.",
        level: "B2",
        tags: "crypto",
    },
    {
        english: "yield farming",
        vietnamese: "canh tác lợi suất",
        definition: "Earning rewards by providing liquidity to DeFi protocols.",
        exampleSentence: "Yield farming can offer high returns but is risky.",
        level: "B2",
        tags: "crypto",
    },
    {
        english: "liquidity pool",
        vietnamese: "bể thanh khoản",
        definition:
            "A collection of funds locked in a smart contract for trading.",
        exampleSentence: "Add funds to a liquidity pool to earn trading fees.",
        level: "B2",
        tags: "crypto",
    },
    {
        english: "tokenomics",
        vietnamese: "kinh tế token",
        definition:
            "The economics of a cryptocurrency — supply, demand, incentives.",
        exampleSentence: "Strong tokenomics can sustain a project long-term.",
        level: "B2",
        tags: "crypto",
    },
    {
        english: "market cap",
        vietnamese: "vốn hóa thị trường",
        definition: "Total value of a cryptocurrency in circulation.",
        exampleSentence: "Bitcoin's market cap exceeds $1 trillion.",
        level: "B1",
        tags: "crypto",
    },
    {
        english: "whitepaper",
        vietnamese: "tài liệu kỹ thuật dự án",
        definition: "A detailed document describing a crypto project.",
        exampleSentence:
            "Read the whitepaper before investing in a new project.",
        level: "B2",
        tags: "crypto",
    },
    {
        english: "airdrop",
        vietnamese: "phát miễn phí token",
        definition: "Free distribution of cryptocurrency tokens.",
        exampleSentence: "Early users received an airdrop of the new token.",
        level: "B2",
        tags: "crypto",
    },
    {
        english: "staking",
        vietnamese: "đặt cọc token để nhận thưởng",
        definition: "Locking up cryptocurrency to receive rewards.",
        exampleSentence: "Staking ETH earns about 4% annual rewards.",
        level: "B2",
        tags: "crypto",
    },
    {
        english: "fork",
        vietnamese: "phân nhánh blockchain",
        definition: "A change to blockchain protocol creating a new version.",
        exampleSentence: "Bitcoin Cash resulted from a fork of Bitcoin.",
        level: "B2",
        tags: "crypto",
    },
    {
        english: "protocol",
        vietnamese: "giao thức",
        definition: "The rules governing a blockchain network.",
        exampleSentence: "The Ethereum protocol enables smart contracts.",
        level: "B2",
        tags: "crypto,technology",
    },
    {
        english: "NFT",
        vietnamese: "token không thay thế được",
        definition:
            "Non-Fungible Token — a unique digital asset on the blockchain.",
        exampleSentence: "He sold his NFT artwork for $1 million.",
        level: "B2",
        tags: "crypto",
    },
    {
        english: "hot wallet",
        vietnamese: "ví nóng (kết nối internet)",
        definition: "A crypto wallet connected to the internet.",
        exampleSentence: "Hot wallets are convenient but less secure.",
        level: "B2",
        tags: "crypto",
    },
    {
        english: "cold wallet",
        vietnamese: "ví lạnh (offline)",
        definition: "An offline crypto storage device.",
        exampleSentence: "Store large holdings in a cold wallet for safety.",
        level: "B2",
        tags: "crypto",
    },
    {
        english: "on-chain",
        vietnamese: "trên blockchain",
        definition: "Activity recorded directly on the blockchain.",
        exampleSentence: "On-chain data reveals whale movements.",
        level: "B2",
        tags: "crypto",
    },
    {
        english: "off-chain",
        vietnamese: "ngoài blockchain",
        definition: "Activity that occurs outside the main blockchain.",
        exampleSentence: "Off-chain transactions are faster and cheaper.",
        level: "B2",
        tags: "crypto",
    },
    {
        english: "whale",
        vietnamese: "cá voi (holder lớn)",
        definition:
            "A person or entity holding large amounts of cryptocurrency.",
        exampleSentence: "A Bitcoin whale moved 10,000 BTC today.",
        level: "B1",
        tags: "crypto",
    },
    {
        english: "FOMO",
        vietnamese: "sợ bỏ lỡ cơ hội",
        definition:
            "Fear Of Missing Out — buying due to fear of missing gains.",
        exampleSentence: "FOMO during a bull run leads to poor decisions.",
        level: "B1",
        tags: "crypto,trading",
    },
    {
        english: "FUD",
        vietnamese: "tin xấu / tạo hoảng loạn",
        definition:
            "Fear, Uncertainty, and Doubt — negative sentiment used to influence markets.",
        exampleSentence: "FUD from bad news sent the price crashing.",
        level: "B2",
        tags: "crypto,trading",
    },
    {
        english: "HODL",
        vietnamese: "giữ tài sản không bán",
        definition: "Holding cryptocurrency long-term regardless of price.",
        exampleSentence: "The strategy is simple: buy and HODL.",
        level: "B1",
        tags: "crypto",
    },
    {
        english: "rugpull",
        vietnamese: "dự án lừa đảo, thoát tiền",
        definition:
            "When developers abandon a project and take investor funds.",
        exampleSentence: "The project turned out to be a rug pull.",
        level: "B2",
        tags: "crypto",
    },
    {
        english: "meme coin",
        vietnamese: "đồng tiền meme",
        definition: "A cryptocurrency based on internet memes with no utility.",
        exampleSentence: "Dogecoin and Shiba Inu are popular meme coins.",
        level: "B1",
        tags: "crypto",
    },
    {
        english: "consensus mechanism",
        vietnamese: "cơ chế đồng thuận",
        definition:
            "The process by which blockchain nodes agree on transactions.",
        exampleSentence:
            "Proof of Work and Proof of Stake are consensus mechanisms.",
        level: "B2",
        tags: "crypto",
    },
    {
        english: "gas optimization",
        vietnamese: "tối ưu hóa phí gas",
        definition:
            "Reducing transaction fees by writing efficient smart contract code.",
        exampleSentence:
            "Gas optimization is important for Ethereum developers.",
        level: "C1",
        tags: "crypto,technology",
    },
    {
        english: "cross-chain",
        vietnamese: "liên chuỗi (kết nối nhiều blockchain)",
        definition:
            "Technology enabling communication between different blockchains.",
        exampleSentence:
            "Cross-chain bridges allow moving assets between networks.",
        level: "B2",
        tags: "crypto",
    },

    // ── AI/ML Advanced (30) ─────────────────────────────────────────────────────
    {
        english: "fine-tuning",
        vietnamese: "tinh chỉnh mô hình AI",
        definition: "Training a pre-trained AI model on a specific dataset.",
        exampleSentence: "Fine-tuning GPT on medical data improves accuracy.",
        level: "B2",
        tags: "ai,ml",
    },
    {
        english: "inference",
        vietnamese: "suy luận / chạy mô hình",
        definition: "Running a trained model to make predictions.",
        exampleSentence:
            "Inference speed is critical for real-time applications.",
        level: "B2",
        tags: "ai,ml",
    },
    {
        english: "token (AI)",
        vietnamese: "token (AI)",
        definition: "A basic unit of text processed by language models.",
        exampleSentence: "GPT-4 has a context window of 128,000 tokens.",
        level: "B2",
        tags: "ai,ml",
    },
    {
        english: "embedding",
        vietnamese: "biểu diễn vector",
        definition: "A numerical representation of text or data for AI.",
        exampleSentence: "Word embeddings capture semantic meaning.",
        level: "C1",
        tags: "ai,ml",
    },
    {
        english: "vector database",
        vietnamese: "cơ sở dữ liệu vector",
        definition:
            "A database optimized for storing and searching embeddings.",
        exampleSentence: "Pinecone is a popular vector database for AI apps.",
        level: "C1",
        tags: "ai,ml",
    },
    {
        english: "attention mechanism",
        vietnamese: "cơ chế chú ý",
        definition:
            "A technique allowing AI to focus on relevant parts of input.",
        exampleSentence:
            "The attention mechanism is the key innovation in Transformers.",
        level: "C1",
        tags: "ai,ml",
    },
    {
        english: "transformer",
        vietnamese: "kiến trúc transformer",
        definition: "A neural network architecture for sequence processing.",
        exampleSentence:
            "GPT and BERT are based on the Transformer architecture.",
        level: "C1",
        tags: "ai,ml",
    },
    {
        english: "prompt engineering",
        vietnamese: "kỹ thuật viết prompt",
        definition: "Crafting inputs to get better outputs from AI models.",
        exampleSentence: "Prompt engineering is a key skill for AI users.",
        level: "B2",
        tags: "ai",
    },
    {
        english: "hallucination",
        vietnamese: "ảo giác AI",
        definition: "When an AI generates false or made-up information.",
        exampleSentence: "ChatGPT sometimes hallucinates facts.",
        level: "B2",
        tags: "ai",
    },
    {
        english: "context window",
        vietnamese: "cửa sổ ngữ cảnh",
        definition: "The amount of text an AI can consider at once.",
        exampleSentence: "A larger context window allows longer conversations.",
        level: "B2",
        tags: "ai,ml",
    },
    {
        english: "temperature (AI)",
        vietnamese: "nhiệt độ (AI)",
        definition: "A parameter controlling randomness in AI responses.",
        exampleSentence: "Set temperature to 0 for deterministic output.",
        level: "B2",
        tags: "ai",
    },
    {
        english: "system prompt",
        vietnamese: "prompt hệ thống",
        definition: "Instructions given to an AI before a conversation begins.",
        exampleSentence:
            "The system prompt defines the AI's role and behavior.",
        level: "B2",
        tags: "ai",
    },
    {
        english: "RAG",
        vietnamese: "truy hồi và tạo sinh (RAG)",
        definition:
            "Retrieval-Augmented Generation — combining search with AI generation.",
        exampleSentence:
            "RAG reduces hallucinations by grounding answers in facts.",
        level: "C1",
        tags: "ai,ml",
    },
    {
        english: "multimodal",
        vietnamese: "đa phương thức",
        definition:
            "AI that processes multiple types of input (text, images, audio).",
        exampleSentence: "GPT-4V is a multimodal model that analyzes images.",
        level: "B2",
        tags: "ai",
    },
    {
        english: "quantization",
        vietnamese: "lượng tử hóa mô hình",
        definition: "Compressing AI models by reducing number precision.",
        exampleSentence:
            "Quantization allows running large models on small devices.",
        level: "C1",
        tags: "ai,ml",
    },
    {
        english: "overfitting",
        vietnamese: "học quá khớp",
        definition:
            "When a model performs well on training data but poorly on new data.",
        exampleSentence:
            "Overfitting occurs when the model memorizes training data.",
        level: "B2",
        tags: "ai,ml",
    },
    {
        english: "underfitting",
        vietnamese: "chưa học đủ",
        definition:
            "When a model is too simple to capture the data's patterns.",
        exampleSentence:
            "Underfitting results in poor performance on all data.",
        level: "B2",
        tags: "ai,ml",
    },
    {
        english: "loss function",
        vietnamese: "hàm mất mát",
        definition: "A function measuring how wrong a model's predictions are.",
        exampleSentence: "Training minimizes the loss function.",
        level: "C1",
        tags: "ai,ml",
    },
    {
        english: "gradient descent",
        vietnamese: "giảm dần gradient",
        definition: "An optimization algorithm to minimize the loss function.",
        exampleSentence:
            "Gradient descent updates model parameters iteratively.",
        level: "C1",
        tags: "ai,ml",
    },
    {
        english: "epoch",
        vietnamese: "epoch (chu kỳ huấn luyện)",
        definition: "One complete pass through the training dataset.",
        exampleSentence: "Training for 10 epochs improved accuracy.",
        level: "B2",
        tags: "ai,ml",
    },
    {
        english: "batch size",
        vietnamese: "kích thước lô dữ liệu",
        definition:
            "The number of samples processed before updating the model.",
        exampleSentence: "A larger batch size speeds up training.",
        level: "B2",
        tags: "ai,ml",
    },
    {
        english: "LLM",
        vietnamese: "mô hình ngôn ngữ lớn",
        definition: "Large Language Model — AI trained on massive text data.",
        exampleSentence: "GPT-4 is one of the most capable LLMs available.",
        level: "B2",
        tags: "ai",
    },
    {
        english: "zero-shot learning",
        vietnamese: "học không cần ví dụ",
        definition:
            "AI ability to perform tasks without task-specific training examples.",
        exampleSentence: "GPT-4 excels at zero-shot reasoning tasks.",
        level: "C1",
        tags: "ai,ml",
    },
    {
        english: "few-shot learning",
        vietnamese: "học từ vài ví dụ ít",
        definition: "AI learning from only a few examples.",
        exampleSentence:
            "Provide a few-shot example in the prompt for better results.",
        level: "C1",
        tags: "ai",
    },
    {
        english: "neural network",
        vietnamese: "mạng nơ-ron nhân tạo",
        definition: "A system of layers modeled after the human brain.",
        exampleSentence: "Deep neural networks power modern AI applications.",
        level: "B2",
        tags: "ai,ml",
    },
    {
        english: "training data",
        vietnamese: "dữ liệu huấn luyện",
        definition: "The dataset used to train a machine learning model.",
        exampleSentence: "Quality training data is critical for AI accuracy.",
        level: "B2",
        tags: "ai,ml",
    },
    {
        english: "API rate limit",
        vietnamese: "giới hạn tần suất API",
        definition: "The maximum number of API requests allowed in a period.",
        exampleSentence: "We hit the API rate limit and had to wait.",
        level: "B2",
        tags: "ai,technology",
    },
    {
        english: "chain of thought",
        vietnamese: "chuỗi suy nghĩ (CoT)",
        definition: "A prompting technique where the AI reasons step by step.",
        exampleSentence:
            "Chain of thought prompting improves complex reasoning.",
        level: "C1",
        tags: "ai",
    },
    {
        english: "model alignment",
        vietnamese: "căn chỉnh mô hình",
        definition: "Ensuring AI behavior matches human values and intentions.",
        exampleSentence: "Model alignment is a central challenge in AI safety.",
        level: "C1",
        tags: "ai",
    },
    {
        english: "generative AI",
        vietnamese: "AI tạo sinh",
        definition:
            "AI that creates new content such as text, images, or code.",
        exampleSentence: "Generative AI is transforming creative industries.",
        level: "B2",
        tags: "ai",
    },
];

async function main() {
    let added = 0,
        skipped = 0;
    for (const w of words) {
        const existing = await prisma.word.findFirst({
            where: { english: w.english },
        });
        if (existing) {
            skipped++;
            continue;
        }
        await prisma.word.create({
            data: {
                english: w.english,
                vietnamese: w.vietnamese,
                definition: w.definition,
                exampleSentence: w.exampleSentence,
                level: w.level,
                tags: w.tags,
            },
        });
        added++;
    }
    console.log(`Specialty Expanded Seed: ${added} added, ${skipped} skipped`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
