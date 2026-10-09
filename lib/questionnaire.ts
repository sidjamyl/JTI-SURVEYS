export type Language = 'fr' | 'en' | 'ar';
export type Mode = 'consumer' | 'retailer';
export type Text = Record<Language, string>;
export const t = (fr: string, en: string, ar: string): Text => ({ fr, en, ar });
export type Answer = string | string[] | Record<string, string>;
export type Answers = Record<string, Answer>;
export type Option = { id: string; label: Text };
export type Question = { id: string; text: Text; type: 'single' | 'multi' | 'sku' | 'number' | 'scale' | 'stock' | 'substitution'; options?: Option[]; max?: number; min?: number; when?: (a: Answers) => boolean };
export type Section = { id: string; title: Text; description: Text; questions: Question[] };
const o = (id: string, fr: string, en: string, ar: string): Option => ({ id, label: t(fr, en, ar) });
export const skus = [
 ['mbo-red','Marlboro','MBO Red','#b52029'], ['gauloises-blue','Gauloises','Gauloises Blondes Blue','#223a7b'], ['lm-red','L&M','L&M Red Label','#b72230'], ['winston-red','Winston','Winston Filters Red','#ca3e36'], ['mbo-gold','Marlboro','MBO Gold','#b2985c'], ['ld-red','LD','LD Red','#9f2632'], ['pm-blue','Philip Morris','Philip Morris Blue','#2c4265'], ['lucky-original','Lucky Strike','Lucky Strike Original','#af2430'], ['business-royals','Business Royals','Business Royals SS','#244e37'], ['pm-silver','Philip Morris','Philip Morris Silver','#9b9e9c'], ['nassim','Nassim','Nassim','#253d71'], ['camel-yellow','Camel','Camel Filters Yellow','#bd9a32'], ['rym','Rym','Rym FF','#9a423b'], ['esse','Esse','Esse Edge 5Mg','#2689aa'], ['hp-silver','H&P','H&P Silver NDP','#959993'], ['mbo-beyond','Marlboro','MBO Beyond','#ab4550'], ['ld-club','LD','LD Club Red','#a82030'], ['rothmans','Rothmans','Rothman Signature','#9a2531'],
].map(([id,brand,name,color], index) => ({ id, brand, name, color, rank: index + 1 }));
export const formats = [o('pack','Paquet entier','Full pack','علبة كاملة'),o('stick','À l’unité','Stick','بالسيجارة'),o('both','Paquet et unité','Both pack and stick','علبة وسيجارة')];
export const stockOptions = [o('full','Disponible','Fully available','متوفر'),o('stick','À l’unité seulement','Available only by stick','بالسيجارة فقط'),o('out','En rupture','Out of stock','غير متوفر'),o('not-sold','Non vendu ici','Not sold here','لا يُباع هنا'),o('unknown','Ne sait pas','Don’t know','لا أعرف')];
const other = o('other','Autre, à préciser','Other, specify','غير ذلك، حدّد');
const unknown = o('unknown','Ne sait pas','Don’t know','لا أعرف');
export const purchased = (a: Answers) => ['intended','same-brand','other-pack','other-stick','category'].includes(String(a.Q5));
export const switched = (a: Answers) => purchased(a) && typeof a.Q6b === 'string' && a.Q6b !== a.Q1;
export function flaggedSkus(a: Answers) { const grid = a.R3 as Record<string,string> | undefined; return skus.filter(s => grid?.[s.id] === 'out' || grid?.[s.id] === 'stick').slice(0,8); }
const q = (id: string, text: Text, options: Option[], extra: Partial<Question> = {}): Question => ({ id,text,type:'single',options,...extra });
const section = (id: string,title: Text,description: Text,questions: Question[]): Section => ({id,title,description,questions});
export const consumerSections: Section[] = [
 section('intention',t('L’achat prévu','Purchase intent','الشراء المخطط'),t('Commençons par le produit recherché.','Let’s start with the product you came for.','لنبدأ بالمنتج الذي كنت تبحث عنه.'),[
  {id:'Q1',text:t('Quel produit aviez-vous l’intention d’acheter ?','Which SKU / variant did you intend to buy at this POS?','ما المنتج الذي كنت تنوي شراءه من نقطة البيع هذه؟'),type:'sku'},
  q('Q2',t('Sous quel format l’achetez-vous habituellement ?','What format do you usually buy with your main SKU?','بأي شكل تشتري منتجك المعتاد؟'),formats),
 ]),
 section('format-reason',t('Votre format','Your format','شكل الشراء'),t('Une précision sur vos habitudes d’achat.','A little more about your buying habits.','تفصيل حول عاداتك في الشراء.'),[
  q('Q2b',t('Pourquoi achetez-vous à la fois par paquet et à l’unité ?','Why do you buy both pack and stick?','لماذا تشتري علبًا كاملة وسجائر منفردة؟'),[o('money','Selon le budget ou l’occasion','It depends on money / occasion','حسب الميزانية أو المناسبة'),o('availability','Selon la disponibilité','It depends on availability','حسب التوفر'),other],{when:a=>a.Q2==='both'}),
 ]),
 section('availability',t('Sur place','At the point of sale','في نقطة البيع'),t('La disponibilité au moment de votre visite.','Availability at the time of your visit.','توفر المنتج وقت زيارتك.'),[
  q('Q3',t('Le produit recherché était-il disponible ?','Was the product you wanted available at this POS?','هل كان المنتج الذي تريده متوفرًا؟'),[o('full','Oui, dans mon format habituel','Yes, my main SKU and preferred format were available','نعم، بالشكل الذي أفضّله'),o('limited','Oui, mais pas dans mon format habituel','Yes, my main SKU was available but not my preferred format','نعم، لكن ليس بالشكل الذي أفضّله'),o('out','Non, ni par paquet ni à l’unité','No, my main SKU was unavailable in both pack and stick','لا، لم يتوفر بعلبة ولا بالسيجارة')]),
  q('Q4',t('Que s’est-il passé lorsque vous l’avez demandé ?','What happened when you asked for it?','ماذا حدث عندما طلبته؟'),[o('had','Le détaillant l’avait','Retailer had it','كان متوفرًا لدى البائع'),o('out','Le détaillant a annoncé une rupture','Retailer said it was out of stock','قال البائع إنه غير متوفر'),o('brand','Il a proposé une autre marque','Retailer offered another brand','اقترح علامة أخرى'),o('sku','Il a proposé une autre référence de la même marque','Retailer offered another SKU of the same brand','اقترح منتجًا آخر من العلامة نفسها'),o('sticks','Il n’avait que des unités','Retailer only had sticks, not packs','لم يكن لديه إلا سجائر منفردة'),o('packs','Il n’avait que des paquets','Retailer only had packs, not sticks','لم يكن لديه إلا علب كاملة'),o('saw','J’ai constaté l’indisponibilité avant de demander','I saw it was unavailable before asking','لاحظت عدم توفره قبل أن أسأل'),other]),
 ]),
 section('decision',t('Votre décision','Your decision','قرارك'),t('Ce que vous avez finalement fait.','What you actually decided to do.','ما الذي قررت فعله في النهاية.'),[
  q('Q5',t('Qu’avez-vous finalement fait ?','What did you finally do?','ماذا فعلت في النهاية؟'),[o('intended','J’ai acheté le produit prévu','Bought the intended SKU','اشتريت المنتج المخطط'),o('same-brand','J’ai acheté une autre référence de la même marque','Bought another SKU from the same brand','اشتريت منتجًا آخر من العلامة نفسها'),o('other-pack','J’ai acheté une autre marque par paquet','Bought another brand by pack','اشتريت علبة من علامة أخرى'),o('other-stick','J’ai acheté une autre marque à l’unité','Bought another brand by stick','اشتريت سجائر منفردة من علامة أخرى'),o('category','J’ai acheté une autre catégorie de produit','Bought another product category','اشتريت فئة أخرى من المنتجات'),o('search','Je vais chercher dans un autre point de vente','Will search in another POS','سأبحث في نقطة بيع أخرى'),o('later','J’achèterai plus tard','Will buy later','سأشتري لاحقًا'),other]),
 ]),
 section('purchase',t('L’achat réalisé','Actual purchase','الشراء الفعلي'),t('Le produit et le format choisis aujourd’hui.','The product and format chosen today.','المنتج وشكل الشراء الذي اخترته اليوم.'),[
  {id:'Q6b',text:t('Quel produit avez-vous acheté ?','Which SKU did you buy?','ما المنتج الذي اشتريته؟'),type:'sku',when:purchased},
  q('Q7',t('Sous quel format l’avez-vous acheté ?','What format did you buy?','بأي شكل اشتريته؟'),formats,{when:purchased}),
 ]),
 section('quantity',t('Les quantités','Quantities','الكميات'),t('Combien avez-vous acheté ?','How much did you buy?','كم اشتريت؟'),[
  {id:'Q7a',text:t('Combien de cigarettes à l’unité ?','How many sticks did you buy?','كم سيجارة منفردة اشتريت؟'),type:'number',min:1,max:15,when:a=>purchased(a)&&['stick','both'].includes(String(a.Q7))},
  {id:'Q7b',text:t('Combien de paquets ?','How many packs did you buy?','كم علبة اشتريت؟'),type:'number',min:1,max:10,when:a=>purchased(a)&&['pack','both'].includes(String(a.Q7))},
 ]),
 section('drivers',t('Les raisons du choix','Choice drivers','أسباب الاختيار'),t('Ce qui a influencé votre décision.','What influenced your decision.','ما الذي أثّر في قرارك.'),[
  q('Q9',t('Comment avez-vous fait ce choix ?','How deliberate was your choice?','كيف اتخذت هذا القرار؟'),[o('deliberate','J’ai choisi précisément cette alternative','I specifically chose this alternative','اخترت هذا البديل تحديدًا'),o('few','Il y avait peu d’options','I chose it because there were few options','اخترته لقلة الخيارات'),o('suggested','J’ai accepté la proposition du détaillant','I accepted what the retailer suggested','قبلت اقتراح البائع'),o('unavailable','Uniquement parce que mon produit était indisponible','I bought it only because my usual product was unavailable','اشتريته فقط لعدم توفر منتجي المعتاد'),o('unsure','Je ne suis pas sûr','Not sure','لست متأكدًا')]),
  q('Q8',t('Pourquoi avez-vous choisi ce produit à la place ?','Why did you choose that SKU instead?','لماذا اخترت هذا المنتج بدلًا من منتجك المعتاد؟'),[o('only','La seule option disponible','Only available option','الخيار الوحيد المتوفر'),o('closest','Le plus proche de mon produit habituel','Closest alternative to my usual product','الأقرب إلى منتجي المعتاد'),o('cheaper','Un prix moins élevé','Cheaper option','سعر أقل'),o('taste','Un goût ou une intensité similaire','Similar taste / strength','مذاق أو قوة مماثلة'),o('trust','Je connais cette marque et lui fais confiance','I know / trust the brand','أعرف العلامة وأثق بها'),o('recommend','La recommandation du détaillant','Retailer recommended it','توصية البائع'),o('stick','Disponible à l’unité','Available by stick','متوفر بالسيجارة'),o('pack','Disponible par paquet','Available by full pack','متوفر بعلبة كاملة'),o('search','Je ne voulais pas chercher ailleurs','Did not want to search elsewhere','لم أرغب في البحث في مكان آخر'),o('budget','Budget insuffisant pour un paquet','Did not have enough money for a full pack','لم تكن ميزانيتي تكفي لعلبة كاملة')],{type:'multi',max:3,when:switched}),
 ]),
 section('retention',t('Et la prochaine fois ?','And next time?','وفي المرة القادمة؟'),t('Votre intention pour les prochains achats.','Your plans for future purchases.','خططك للمشتريات القادمة.'),[
  q('Q10',t('Si votre produit habituel revient, que ferez-vous probablement ?','If your intended product becomes available again, what will you most likely do?','إذا توفر منتجك المعتاد مجددًا، ماذا ستفعل على الأرجح؟'),[o('return','Revenir à mon produit habituel','Return to my intended / usual product','أعود إلى منتجي المعتاد'),o('continue','Continuer avec le produit acheté aujourd’hui','Continue buying the product I bought today','أستمر في شراء منتج اليوم'),o('availability','Acheter les deux selon la disponibilité','Buy both depending on availability','أشتري الاثنين حسب التوفر'),o('price','Acheter les deux selon le prix','Buy both depending on price','أشتري الاثنين حسب السعر'),o('unsure','Je ne suis pas sûr','Not sure','لست متأكدًا')]),
  {id:'Q11',text:t('Quelle est la probabilité de racheter le produit d’aujourd’hui ?','How likely are you to buy again the product you bought today?','ما احتمال أن تشتري منتج اليوم مجددًا؟'),type:'scale',when:switched},
  q('Q12',t('Qu’est-ce qui vous ferait revenir à votre marque d’origine ?','What would make you return to your original brand?','ما الذي يدفعك للعودة إلى علامتك الأصلية؟'),[o('availability','Une meilleure disponibilité','Better availability','توفر أفضل'),o('price','Un prix identique ou stable','Same / stable price','السعر نفسه أو سعر ثابت'),o('quality','Une meilleure fraîcheur ou qualité','Better freshness / quality','جودة أو طزاجة أفضل'),o('stick','La vente à l’unité','Available by stick','توفر البيع بالسيجارة'),o('recommend','La recommandation du détaillant','Retailer recommendation','توصية البائع'),o('return','Rien, j’y reviendrai de toute façon','Nothing, I will return anyway','لا شيء، سأعود على أي حال'),o('stay','Rien, je pourrais garder la nouvelle marque','Nothing, I may continue with the new brand','لا شيء، قد أستمر مع العلامة الجديدة'),other],{type:'multi',when:switched}),
 ]),

];
const brandOptions = ['Camel','Winston','LD','Marlboro','L&M','Gauloises','Rothmans'].map(b=>o(b,b,b,b)).concat(other);
export const retailerSections: Section[] = [
 section('context',t('Le point de vente','Point of sale','نقطة البيع'),t('Situez l’entretien et identifiez le commerce.','Locate the interview and identify the store.','حدّد مكان المقابلة ونوع المتجر.'),[
  q('R2',t('Quel est le type de point de vente ?','What is the POS type?','ما نوع نقطة البيع؟'),[o('grocery','Épicerie traditionnelle','Traditional grocery','بقالة تقليدية'),o('tobacco','Débit de tabac','Tobacco specialist','متجر تبغ'),o('kiosk','Kiosque','Kiosk','كشك'),other]),
 ]),
 section('stock',t('La disponibilité','Availability snapshot','توفر المنتجات'),t('Un état des lieux pour les 18 références.','A snapshot of all 18 product variants.','حالة التوفر للمنتجات الثمانية عشر.'),[
  {id:'R3',text:t('Quel est le statut de chaque produit dans ce point de vente ?','Please indicate the current availability status for each SKU at this POS.','ما حالة توفر كل منتج في نقطة البيع هذه؟'),type:'stock'},
 ]),
 section('sticks',t('La vente à l’unité','Stick sales','البيع بالسيجارة'),t('Les habitudes d’achat et leur évolution.','Buying habits and how they’re changing.','عادات الشراء وتغيّرها.'),[
  q('R4',t('Les ventes à l’unité ont-elles augmenté récemment ?','Compared to usual, have stick sales increased recently?','هل زادت مبيعات السجائر المنفردة مؤخرًا؟'),[o('much','Forte augmentation','Increased significantly','زادت كثيرًا'),o('slight','Légère augmentation','Increased slightly','زادت قليلًا'),o('same','Pas de changement','No change','لم تتغير'),o('less','Diminution','Decreased','انخفضت'),unknown]),
  q('R5',t('En cas de rupture, les consommateurs choisissent-ils plus souvent l’unité ?','When there are stock issues, do consumers choose sticks more often?','عند نقص المخزون، هل يختار المستهلكون الشراء بالسيجارة أكثر؟'),[o('much','Oui, beaucoup plus','Yes, much more often','نعم، أكثر بكثير'),o('slight','Oui, légèrement plus','Yes, slightly more often','نعم، أكثر قليلًا'),o('same','Pas de changement','No change','لم يتغير'),o('less','Moins souvent','Less often','أقل من السابق'),unknown]),
  q('R6',t('Quelle situation décrit le mieux les achats actuels à l’unité ?','Which statement best describes current behavior?','ما العبارة التي تصف سلوك الشراء الحالي بشكل أفضل؟'),[o('unavailable','Le paquet habituel n’est pas disponible','People choose sticks because their usual pack is unavailable','يشترون بالسيجارة لعدم توفر العلبة المعتادة'),o('money','Le budget ne permet pas d’acheter un paquet','People choose sticks because they cannot afford a full pack','يشترون بالسيجارة لأن الميزانية لا تكفي لعلبة كاملة'),o('try','Pour essayer une autre marque','People choose sticks to try another brand','لتجربة علامة أخرى'),o('search','En attendant de trouver leur marque ailleurs','People choose sticks while searching for their usual brand elsewhere','أثناء البحث عن علامتهم المعتادة في مكان آخر'),o('same','Pas de changement majeur','No major change in stick purchases','لا تغيّر ملحوظ'),other]),
 ]),
 section('substitution',t('Les alternatives','Substitutions','البدائل'),t('Ce que les consommateurs choisissent en cas de rupture.','What consumers choose when stock is disrupted.','ما يختاره المستهلكون عند عدم توفر المنتج.'),[
  q('R7',t('Que se passe-t-il généralement lorsqu’une marque n’est pas disponible ?','When a consumer asks for an unavailable brand, what usually happens?','ماذا يحدث عادة عندما يطلب المستهلك علامة غير متوفرة؟'),[o('brand','Ils achètent une autre marque ici','They buy another brand in this POS','يشترون علامة أخرى من هنا'),o('sku','Ils achètent une autre référence de la même marque','They buy another SKU from the same brand','يشترون منتجًا آخر من العلامة نفسها'),o('stick','Ils achètent à l’unité','They buy by stick instead','يشترون بالسيجارة'),o('leave','Ils partent chercher ailleurs','They leave to search elsewhere','يغادرون للبحث في مكان آخر'),o('none','Ils n’achètent rien','They do not buy','لا يشترون شيئًا')]),
  {id:'R8',text:t('Quel produit choisissent-ils le plus souvent quand ces références sont indisponibles ?','For the SKUs flagged out of stock or stick-only, which product do consumers most often switch to?','إلى أي منتج ينتقل المستهلكون غالبًا عند عدم توفر هذه المنتجات؟'),type:'substitution',when:a=>flaggedSkus(a).length>0},
 ]),
 section('recommendation',t('Votre recommandation','Your recommendation','توصيتك'),t('Votre rôle dans le choix d’une alternative.','Your role in choosing an alternative.','دورك في اختيار البديل.'),[
  q('R9',t('Recommandez-vous habituellement une alternative ?','Do you usually recommend an alternative when the requested brand is unavailable?','هل توصي عادة ببديل عندما لا تتوفر العلامة المطلوبة؟'),[o('always','Oui, toujours','Yes, always','نعم، دائمًا'),o('sometimes','Oui, parfois','Yes, sometimes','نعم، أحيانًا'),o('decides','Non, le consommateur décide','No, consumer decides','لا، المستهلك يقرر'),o('no','Non, j’annonce simplement l’indisponibilité','No, I just say it is unavailable','لا، أكتفي بإبلاغه بعدم توفرها')]),
 ]),
 section('recommendation-type',t('L’alternative conseillée','Recommended alternative','البديل المقترح'),t('Le critère qui guide votre recommandation.','What guides your recommendation.','ما الذي يوجّه توصيتك.'),[
  q('R10',t('Que recommandez-vous généralement ?','What do you usually recommend?','بماذا توصي عادة؟'),[o('family','La même famille de marque','Same brand family','من عائلة العلامة نفسها'),o('price','Le prix le plus proche','Closest price','الأقرب سعرًا'),o('taste','Le goût ou l’intensité les plus proches','Closest taste / strength','الأقرب مذاقًا أو قوة'),o('availability','Une marque mieux disponible','Brand with better availability','علامة أكثر توفرًا'),o('margin','Une marque avec une meilleure marge','Brand with better margin','علامة بهامش ربح أفضل'),o('requested','Une marque demandée par d’autres clients','Brand requested by other consumers','علامة يطلبها مستهلكون آخرون'),o('any','Ce qui est disponible','Whatever is available','ما هو متوفر'),other],{when:a=>['always','sometimes'].includes(String(a.R9))}),
 ]),
 section('return',t('Les tendances observées','Observed trends','الاتجاهات الملحوظة'),t('Le retour aux marques et les effets des ruptures.','Returning to brands and the effects of stock disruptions.','العودة إلى العلامات وتأثير نقص المخزون.'),[
  q('R16',t('Quand les marques reviennent en stock, que font les consommateurs ?','When unavailable brands come back in stock, what do consumers usually do?','ماذا يفعل المستهلكون عادة عندما تتوفر العلامات مجددًا؟'),[o('return','La plupart reviennent à leur marque habituelle','Most return to their usual brand','يعود معظمهم إلى علامتهم المعتادة'),o('some','Certains reviennent, d’autres gardent l’alternative','Some return, some stay with the substitute','يعود بعضهم ويبقى آخرون مع البديل'),o('stay','Beaucoup continuent avec l’alternative','Many continue with the substitute','يستمر كثيرون مع البديل'),o('price','Cela dépend du prix','Depends on price','حسب السعر'),o('availability','Cela dépend de la stabilité de la disponibilité','Depends on availability stability','حسب استقرار التوفر'),unknown]),
  q('R17',t('Quelles marques bénéficient le plus des ruptures ?','Which brands are currently benefiting most from stock disruptions?','ما العلامات الأكثر استفادة من نقص المخزون؟'),brandOptions,{type:'multi'}),

 ]),
 section('losses',t('Les marques pénalisées','Brands losing sales','العلامات المتضررة'),t('Le dernier regard sur les effets des ruptures.','A final look at the effects of stock disruptions.','نظرة أخيرة على تأثير نقص المخزون.'),[
  q('R18',t('Quelles marques sont les plus pénalisées par les ruptures ?','Which brands are losing most because of out of stock?','ما العلامات الأكثر تضررًا من نقص المخزون؟'),brandOptions,{type:'multi'}),
 ]),
];
export function activeSections(mode: Mode, answers: Answers): Section[] {
 return (mode === 'consumer' ? consumerSections : retailerSections).map(s=>({...s,questions:s.questions.filter(q=>!q.when||q.when(answers))})).filter(s=>s.questions.length>0);
}
export function questionValid(q: Question, a: Answers): boolean {
 const value=a[q.id];
 if(q.type==='stock') { const v=value as Record<string,string>;return !!v&&skus.every(s=>stockOptions.some(o=>o.id===v[s.id])); }
 if(q.type==='substitution') { const v=value as Record<string,string>;return !!v&&flaggedSkus(a).every(s=>{
  const primary=v[s.id],second=v[s.id+'-second']; const valid=(x:string)=>skus.some(p=>p.id===x)||['other','none'].includes(x);
  return valid(primary)&&(!second||(valid(second)&&second!==primary))&& (![primary,second].includes('other')||!!v[s.id+'-other']?.trim());
 }); }
 if(q.type==='number') return typeof value==='string' && /^\d+$/.test(value)&&Number(value)>=(q.min??1)&&Number(value)<=(q.max??Infinity);
 if(q.type==='scale') return typeof value==='string'&&['1','2','3','4','5'].includes(value);
 if(q.type==='sku') return typeof value==='string' && skus.some(s=>s.id===value);
 if(q.type==='multi') {
  if(!Array.isArray(value)||!value.length||new Set(value).size!==value.length||(q.max&&value.length>q.max)||!value.every(v=>q.options?.some(o=>o.id===v)))return false;
 } else if(typeof value!=='string'||!q.options?.some(o=>o.id===value)) return false;
 const hasOther=Array.isArray(value)?value.includes('other'):value==='other';
 return !hasOther || (typeof a[q.id+'-other']==='string'&&String(a[q.id+'-other']).trim().length>0);
}
export function cleanAnswers(mode:Mode,a:Answers):Answers {
 const cleaned:Answers={};
 for(const s of activeSections(mode,a))for(const q of s.questions) {
  if(q.id==='R8') {const grid=a.R8 as Record<string,string>;const v:Record<string,string>={};for(const sku of flaggedSkus(a))for(const suffix of ['','-second','-other'])if(grid?.[sku.id+suffix]&&(suffix!=='-other'||[grid[sku.id],grid[sku.id+'-second']].includes('other')))v[sku.id+suffix]=grid[sku.id+suffix];cleaned.R8=v;}
  else {cleaned[q.id]=a[q.id];const value=a[q.id];if(value==='other'||(Array.isArray(value)&&value.includes('other')))cleaned[q.id+'-other']=a[q.id+'-other'];}
 }
 return cleaned;
}
