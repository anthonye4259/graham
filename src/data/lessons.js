// GRAHAM — Daily Lessons (AI-personalized in production)

export const DAILY_LESSONS = [
  // ===== BEGINNER BASICS =====
  { id:'basics_1', category:'basics', title:'What Is a Stock?', icon:'extension-puzzle-outline',
    body:'Imagine your favorite pizza shop needs money to open a second location. They split the business into 1,000 tiny pieces and sell them. Each piece is a "share." If you buy 10 shares, you own 1% of that pizza shop. That\'s all a stock is — a tiny piece of a real business.',
    takeaway:'A stock = a tiny piece of a company. You\'re literally a part-owner.',
    quiz:{ q:'When you buy a stock, you\'re buying:', opts:['A loan to the company','A small piece of ownership in the company'], correct:1, explain:'You become a part-owner. If the company grows, your piece becomes worth more.' }},

  { id:'basics_2', category:'basics', title:'Why Prices Go Up and Down', icon:'trending-up-outline',
    body:'Think of it like sneakers. When a new Jordan drops and everyone wants it, the price goes up. When nobody wants last year\'s model, it drops. Stocks work the same way — prices move based on how many people want to buy vs. sell. Most daily price swings are just noise, not real news.',
    takeaway:'Prices = supply and demand. Daily swings are mostly noise.',
    quiz:{ q:'A stock drops 5% in one day. This most likely means:', opts:['The company is in serious trouble','More people sold than bought — totally normal'], correct:1, explain:'5% daily moves happen all the time. It rarely says anything about the company\'s health.' }},

  { id:'basics_3', category:'basics', title:'What\'s the S&P 500?', icon:'stats-chart-outline',
    body:'The S&P 500 is a list of the 500 biggest US companies — Apple, Amazon, Google, McDonald\'s, etc. When the news says "the market is up," they usually mean this list. You can buy ALL 500 companies at once with a single "index fund." It\'s the easiest way to start investing.',
    takeaway:'One S&P 500 index fund = instant ownership of 500 companies.',
    quiz:{ q:'An S&P 500 index fund gives you:', opts:['One big company\'s stock','Diversified ownership across 500 companies'], correct:1, explain:'This is why Warren Buffett recommends index funds for beginners.' }},

  { id:'basics_4', category:'basics', title:'Paper Losses Aren\'t Real Losses', icon:'hourglass-outline',
    body:'If your stock drops 20% but you don\'t sell, you haven\'t actually lost money. It\'s called a "paper loss" — it\'s just a number on your screen. The only way to turn it into a real loss is to panic and sell. Historically, the stock market has ALWAYS recovered from every crash.',
    takeaway:'Paper losses aren\'t real losses. Patience is your superpower.',
    quiz:{ q:'"I lost $500 on stocks today." Is this true if they didn\'t sell?', opts:['Yes, the money is gone','No — it\'s a paper loss until you actually sell'], correct:1, explain:'Unrealized losses only become real when you sell.' }},

  // ===== OPTIONS TRADING =====
  { id:'options_1', category:'options', title:'What Are Options?', icon:'ticket-outline',
    body:'Imagine you find a house you love for $300K, but you\'re not ready to buy yet. You pay the owner $5K for the RIGHT to buy it at $300K anytime in the next 6 months. If the house goes to $400K, you exercise your option and profit $95K. If it drops, you just walk away and lose only the $5K. That\'s an option — paying a small fee for the RIGHT (not obligation) to buy or sell at a set price.',
    takeaway:'An option = paying a small premium for the right to buy/sell at a locked-in price.',
    quiz:{ q:'An options contract gives you:', opts:['The obligation to buy a stock','The RIGHT (but not obligation) to buy or sell at a set price'], correct:1, explain:'Options give you the right, not the obligation. The most you can lose is the premium.' }},

  { id:'options_2', category:'options', title:'Calls vs. Puts', icon:'swap-vertical-outline',
    body:'There are only TWO types of options:\n\nCALL = "I think the stock will go UP." You\'re buying the right to purchase at today\'s price.\n\nPUT = "I think the stock will go DOWN." You\'re buying the right to sell at today\'s price.\n\nThink of it this way: you CALL up the stock (wanting it to rise), or you PUT it down (betting it falls).',
    takeaway:'Call = betting UP. Put = betting DOWN. That\'s it.',
    quiz:{ q:'You think Apple stock will rise next month. Which option do you buy?', opts:['A put option','A call option'], correct:1, explain:'A call gives you the right to buy at today\'s price. If Apple rises, your call becomes more valuable.' }},

  { id:'options_3', category:'options', title:'Strike Price & Expiration', icon:'flag-outline',
    body:'Every option has two critical numbers:\n\nSTRIKE PRICE — The price you\'re locking in. "I want the right to buy Apple at $180."\n\nEXPIRATION — When your right expires. "...by March 15th."\n\nAfter expiration, your option is worthless. This is why options are riskier than stocks — there\'s a ticking clock.',
    takeaway:'Strike = your locked price. Expiration = your deadline. After that, it\'s gone.',
    quiz:{ q:'What happens to an option after its expiration date?', opts:['It automatically renews','It becomes worthless if not exercised'], correct:1, explain:'Options have a shelf life. Unlike stocks, which you can hold forever, options expire.' }},

  { id:'options_4', category:'options', title:'Why Options Are Risky', icon:'flash-outline',
    body:'Options are LEVERAGE. With $500, you could buy 2 shares of a $250 stock. OR you could buy options controlling 100 shares. If the stock goes up 10%, your shares gain $50. But your options might gain $500. The flip side? If the stock doesn\'t move enough by expiration, you lose your entire $500.',
    takeaway:'Options = leverage. Bigger gains AND bigger losses. Start small.',
    quiz:{ q:'The main risk of buying options vs. stocks is:', opts:['Options are illegal for beginners','Options can expire worthless — you can lose 100%'], correct:1, explain:'About 65% of options expire worthless. With stocks, you can hold through downturns.' }},

  { id:'options_5', category:'options', title:'Covered Calls', icon:'wallet-outline',
    body:'Here\'s a safer options strategy: You own 100 shares of Apple at $180. You sell someone the RIGHT to buy your shares at $200 for a $3 premium. You collect $300 cash immediately. If Apple stays below $200, you keep your shares AND the $300. If it goes above $200, you sell at $200 (still a profit) and keep the $300.',
    takeaway:'Covered calls = earn income on stocks you already own.',
    quiz:{ q:'A covered call lets you:', opts:['Bet big on a stock crashing','Earn premium income on stocks you already own'], correct:1, explain:'Covered calls are one of the most popular beginner-friendly options strategies.' }},

  // ===== PSYCHOLOGY =====
  { id:'psych_1', category:'psychology', title:'Why Headlines Make You Worse', icon:'newspaper-outline',
    body:'Financial media makes money from your ATTENTION, not your returns. "MARKET CRASH" gets 10x more clicks than "Market had a normal bad day." Studies show that investors who check the news daily trade more often and earn LESS than people who check quarterly.',
    takeaway:'Less news = better returns. Be boring.',
    quiz:{ q:'Watching financial news daily tends to:', opts:['Help you make smarter decisions','Increase anxiety and lead to worse returns'], correct:1, explain:'Research shows frequent news consumers earn lower returns.' }},

  { id:'psych_2', category:'psychology', title:'The Power of Compound Interest', icon:'layers-outline',
    body:'$100/month at 10% average annual return:\n\n10 years → $20,655\n20 years → $76,570\n30 years → $227,000\n\nYou only put in $36,000. The rest — $191,000 — is your money making money, which makes MORE money. Einstein called it the 8th wonder of the world.',
    takeaway:'Start early. The last decade of compounding does most of the work.',
    quiz:{ q:'Compound interest means:', opts:['You earn interest only on your deposit','You earn interest on your interest — it snowballs'], correct:1, explain:'This is why starting at 25 vs. 35 means hundreds of thousands more by retirement.' }},

  // ===== STRATEGY =====
  { id:'strategy_1', category:'strategy', title:'Dollar-Cost Averaging', icon:'calendar-outline',
    body:'Invest a fixed amount on a schedule ($50 every week). When prices are high, you buy fewer shares. When they\'re low, you buy more. You never have to "time" the market. Over 20+ years, this simple strategy beats 90% of professional fund managers.',
    takeaway:'Set it. Forget it. Auto-invest beats trying to be clever.',
    quiz:{ q:'Dollar-cost averaging means:', opts:['Only buying when stocks are cheap','Investing a fixed amount on a regular schedule'], correct:1, explain:'DCA removes emotion from investing. No more agonizing over timing.' }},

  { id:'strategy_2', category:'strategy', title:'ETFs: One Click, Hundreds of Stocks', icon:'cube-outline',
    body:'An ETF (Exchange-Traded Fund) bundles many stocks into one purchase. Want tech? QQQ holds 100 top tech companies. Want everything? VTI holds the entire US market. Instead of picking one stock and praying, you buy a basket.',
    takeaway:'ETFs = instant diversification. One click, hundreds of companies.',
    quiz:{ q:'An ETF is:', opts:['A single trending stock','A bundle of many stocks you buy as one unit'], correct:1, explain:'ETFs trade like stocks but contain dozens or hundreds of companies. Low fees, instant diversification.' }},

  // ===== PERSONAL FINANCE =====
  { id:'pf_1', category:'personal_finance', title:'The Emergency Fund Rule', icon:'shield-checkmark-outline',
    body:'Before investing a single dollar, save 3-6 months of living expenses in a high-yield savings account (earning 4-5% APY right now). This is your safety net. Without it, one unexpected expense could force you to sell investments at a loss.',
    takeaway:'Emergency fund FIRST. Then invest. No exceptions.',
    quiz:{ q:'Before investing, you should:', opts:['Put everything into stocks immediately','Save 3-6 months of expenses as a safety net'], correct:1, explain:'An emergency fund prevents you from being forced to sell at the worst time.' }},

  { id:'pf_2', category:'personal_finance', title:'Roth IRA: The Best Account', icon:'trophy-outline',
    body:'A Roth IRA lets you invest up to $7,000/year. The magic? Your investments grow COMPLETELY tax-free. If you put in $7K/year from age 25-65 and earn 10% average returns, you\'ll have about $3.5 MILLION — and you won\'t owe a single dollar in taxes.',
    takeaway:'Roth IRA = tax-free growth forever. Max it out if you can.',
    quiz:{ q:'The main benefit of a Roth IRA is:', opts:['You get a tax deduction today','Your investments grow and are withdrawn completely tax-free'], correct:1, explain:'You contribute after-tax money, but everything comes out tax-free in retirement.' }},
];

export const GOAL_CATEGORIES = {
  grow_wealth: ['strategy','basics','options','psychology','personal_finance'],
  retirement: ['personal_finance','strategy','basics','psychology','options'],
  passive_income: ['strategy','options','basics','personal_finance','psychology'],
  learn_basics: ['basics','psychology','strategy','personal_finance','options'],
  learn_options: ['options','basics','strategy','psychology','personal_finance'],
};
