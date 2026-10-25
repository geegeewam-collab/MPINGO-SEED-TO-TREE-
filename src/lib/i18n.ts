// Public-page wording. Kiswahili is a first draft for MRI to review and approve before launch.
export type Lang = 'en' | 'sw';

const en = {
  tagline: 'Restoring Mpingo, growing value',
  nav: { how: 'How it works', library: 'Library', request: 'Request seed', join: 'Join', signIn: 'Sign in', menu: 'Main', language: 'Language' },
  hero: {
    title: 'Follow every Mpingo from seed to living tree.',
    body: 'A shared record for the people restoring African blackwood in Kenya: where seed comes from, how nurseries grow it, where it is planted, and whether it survives.',
    join: 'Join the network', request: 'Request seed or seedlings',
    logoAlt: 'Mpingo Restoration Initiative logo: a mpingo tree beside a block of blackwood, a piano and a guitar.',
  },
  who: {
    title: 'Who are you?',
    items: [
      ['Seed collector', 'Register mother trees and the seed you collect.', '/join'],
      ['Nursery', 'Record batches and seedling stock.', '/join'],
      ['Grower or planter', 'Request seedlings and record where they are planted.', '/seed-requests/new'],
      ['Sponsor', 'Follow a grove and its verified survival.', '/#sponsor'],
    ],
  },
  numbers: {
    title: 'Verified so far',
    awaiting: 'Awaiting verification',
    note: 'Only figures that a second person has reviewed are shown.',
    items: ['Mother trees registered', 'Seedlings distributed', 'Trees planted', 'Survival of trees checked'],
  },
  journey: {
    title: 'One connected journey',
    steps: [
      ['Seed', 'Mother trees are registered and every seed lot records which trees it came from.'],
      ['Nursery', 'Batches are sown, counted and tracked, so stock is never a guess.'],
      ['Distribution', 'Seedlings leave a nursery only through an approved, recorded transfer.'],
      ['Planting', 'Growers record where and when trees go in the ground.'],
      ['Survival', 'Field checks are reviewed by a second person before any result is published.'],
    ],
    read: 'Read the guides',
  },
  trust: {
    title: 'Results you can check',
    items: [
      ['Verified, not claimed', 'A survival figure is published only after a second person has reviewed the field check.'],
      ['Honest about the unknown', 'Trees that could not be confirmed are never counted as alive or dead.'],
      ['Locations stay protected', 'Exact positions of mother trees and planting sites are private. Public pages show an approved summary only.'],
    ],
    link: 'How verification works',
  },
  library: { title: 'Learn how to collect, grow and plant Mpingo', body: 'Guides published by the network team, in English and Kiswahili.', cta: 'Open the library' },
  about: {
    title: 'About the Mpingo Restoration Initiative',
    body: 'The Mpingo Restoration Initiative works to restore African blackwood (Dalbergia melanoxylon) in Kenya. Mpingo is prized for musical instruments such as clarinets, oboes, guitars and pianos, and for carving. This network keeps one honest record of the work, from the first mother tree to a tree that is still alive years later.',
  },
  sponsor: {
    title: 'Sponsor a grove',
    body: 'A sponsored grove gets its own public page with the planting record and survival results that a second person has verified. Get in touch to talk about sponsoring one.',
    cta: 'Talk to us', fallback: 'Join the network',
  },
  faq: {
    title: 'Common questions',
    items: [
      ['Who can join?', 'Growers, nurseries, researchers, conservation organisations, students and volunteers. A coordinator reviews every application.'],
      ['What happens to a seed or seedling request?', 'It is checked against available, verified supply. A request is not a confirmed allocation. A coordinator contacts you with the next steps.'],
      ['Can anyone see where the trees are?', 'No. Exact positions of mother trees and planting sites are private. Public pages show an approved summary only.'],
    ],
  },
  footer: { rights: 'Mpingo Restoration Initiative', location: 'Exact tree locations are never published.', privacy: 'Your details are used only to review your application or request.', email: 'Email', whatsapp: 'WhatsApp us' },
  bar: { whatsapp: 'WhatsApp' },
  verification: {
    title: 'How verification works',
    intro: 'Every survival figure on this site has been checked by two different people.',
    steps: [
      ['A field check is recorded', 'A grower or field officer counts the trees at a planting site and records how many are alive, dead, could not be confirmed, or were not inspected.'],
      ['A second person reviews it', 'A verifier who did not submit the check reviews it. Nobody can review their own submission, and the counts must add up to the number planted.'],
      ['Only then is it published', 'Once verified, a check cannot be changed. Public pages show the verified result and the date of the field check.'],
    ],
    unknown: 'Trees that could not be confirmed are shown separately. They are never counted as alive or dead.',
    back: 'Back to home',
  },
};

const sw: typeof en = {
  tagline: 'Kurejesha Mpingo, kukuza thamani',
  nav: { how: 'Jinsi inavyofanya kazi', library: 'Maktaba', request: 'Omba mbegu', join: 'Jiunge', signIn: 'Ingia', menu: 'Kuu', language: 'Lugha' },
  hero: {
    title: 'Fuatilia kila Mpingo kutoka mbegu hadi mti hai.',
    body: 'Kumbukumbu ya pamoja kwa watu wanaorejesha mpingo (African blackwood) nchini Kenya: mbegu zinatoka wapi, vitalu huzikuza vipi, hupandwa wapi, na kama zinaendelea kuishi.',
    join: 'Jiunge na mtandao', request: 'Omba mbegu au miche',
    logoAlt: 'Nembo ya Mpingo Restoration Initiative: mti wa mpingo kando ya gogo la mpingo, piano na gitaa.',
  },
  who: {
    title: 'Wewe ni nani?',
    items: [
      ['Mkusanyaji wa mbegu', 'Sajili miti mama na mbegu unazokusanya.', '/join'],
      ['Kitalu', 'Rekodi makundi ya miche na hesabu ya miche.', '/join'],
      ['Mkulima au mpandaji', 'Omba miche na rekodi mahali ilipopandwa.', '/seed-requests/new'],
      ['Mfadhili', 'Fuatilia shamba la miti na uhai wake uliothibitishwa.', '/#sponsor'],
    ],
  },
  numbers: {
    title: 'Vilivyothibitishwa hadi sasa',
    awaiting: 'Inasubiri uthibitisho',
    note: 'Takwimu zilizopitiwa na mtu wa pili pekee ndizo zinaonyeshwa.',
    items: ['Miti mama iliyosajiliwa', 'Miche iliyosambazwa', 'Miti iliyopandwa', 'Uhai wa miti iliyokaguliwa'],
  },
  journey: {
    title: 'Safari moja iliyounganishwa',
    steps: [
      ['Mbegu', 'Miti mama husajiliwa na kila kundi la mbegu hurekodi lilitoka kwenye miti ipi.'],
      ['Kitalu', 'Makundi hupandwa, huhesabiwa na kufuatiliwa, hivyo hesabu ya miche si ya kukisia.'],
      ['Usambazaji', 'Miche hutoka kitaluni kupitia uhamisho ulioidhinishwa na kurekodiwa tu.'],
      ['Upandaji', 'Wakulima hurekodi mahali na wakati miti inapopandwa.'],
      ['Uhai', 'Ukaguzi wa shambani hupitiwa na mtu wa pili kabla ya matokeo yoyote kuchapishwa.'],
    ],
    read: 'Soma miongozo',
  },
  trust: {
    title: 'Matokeo unayoweza kuyahakiki',
    items: [
      ['Yamethibitishwa, si madai', 'Takwimu ya uhai huchapishwa tu baada ya mtu wa pili kupitia ukaguzi wa shambani.'],
      ['Tunakiri tusiyojua', 'Miti isiyoweza kuthibitishwa haihesabiwi kuwa hai wala imekufa.'],
      ['Maeneo yanalindwa', 'Mahali kamili pa miti mama na mashamba ya kupanda ni siri. Kurasa za umma zinaonyesha muhtasari ulioidhinishwa tu.'],
    ],
    link: 'Uthibitisho unavyofanya kazi',
  },
  library: { title: 'Jifunze jinsi ya kukusanya, kukuza na kupanda Mpingo', body: 'Miongozo iliyochapishwa na timu ya mtandao, kwa Kiingereza na Kiswahili.', cta: 'Fungua maktaba' },
  about: {
    title: 'Kuhusu Mpingo Restoration Initiative',
    body: 'Mpingo Restoration Initiative inafanya kazi ya kurejesha mpingo (African blackwood, Dalbergia melanoxylon) nchini Kenya. Mpingo unathaminiwa kwa kutengeneza ala za muziki kama vile klarineti, obo, gitaa na piano, na kwa uchongaji. Mtandao huu unatunza kumbukumbu moja ya kweli ya kazi hii, kuanzia mti mama wa kwanza hadi mti ambao bado uko hai miaka mingi baadaye.',
  },
  sponsor: {
    title: 'Fadhili shamba la miti',
    body: 'Shamba la miti lililofadhiliwa hupata ukurasa wake wa umma wenye rekodi ya upandaji na matokeo ya uhai yaliyothibitishwa na mtu wa pili. Wasiliana nasi kuzungumzia kufadhili.',
    cta: 'Zungumza nasi', fallback: 'Jiunge na mtandao',
  },
  faq: {
    title: 'Maswali ya kawaida',
    items: [
      ['Nani anaweza kujiunga?', 'Wakulima, vitalu, watafiti, mashirika ya uhifadhi, wanafunzi na wajitolea. Mratibu hupitia kila maombi.'],
      ['Ombi la mbegu au miche hufanywaje?', 'Hulinganishwa na akiba iliyopo na iliyothibitishwa. Ombi si ahadi ya kupewa. Mratibu atawasiliana nawe kwa hatua zinazofuata.'],
      ['Je, mtu yeyote anaweza kuona miti ilipo?', 'Hapana. Mahali kamili pa miti mama na mashamba ya kupanda ni siri. Kurasa za umma zinaonyesha muhtasari ulioidhinishwa tu.'],
    ],
  },
  footer: { rights: 'Mpingo Restoration Initiative', location: 'Mahali kamili pa miti hapachapishwi kamwe.', privacy: 'Taarifa zako hutumika tu kupitia maombi yako.', email: 'Barua pepe', whatsapp: 'Tuandikie WhatsApp' },
  bar: { whatsapp: 'WhatsApp' },
  verification: {
    title: 'Uthibitisho unavyofanya kazi',
    intro: 'Kila takwimu ya uhai kwenye tovuti hii imekaguliwa na watu wawili tofauti.',
    steps: [
      ['Ukaguzi wa shambani unarekodiwa', 'Mkulima au afisa wa shambani anahesabu miti kwenye shamba la kupanda na kurekodi ngapi ziko hai, zimekufa, hazikuweza kuthibitishwa, au hazikukaguliwa.'],
      ['Mtu wa pili anaupitia', 'Mthibitishaji ambaye hakuwasilisha ukaguzi huo anaupitia. Hakuna anayeweza kupitia aliyowasilisha mwenyewe, na jumla lazima ilingane na idadi iliyopandwa.'],
      ['Ndipo unachapishwa', 'Ukishathibitishwa, ukaguzi hauwezi kubadilishwa. Kurasa za umma zinaonyesha matokeo yaliyothibitishwa na tarehe ya ukaguzi.'],
    ],
    unknown: 'Miti isiyoweza kuthibitishwa inaonyeshwa kando. Haihesabiwi kuwa hai wala imekufa.',
    back: 'Rudi mwanzo',
  },
};

export const copy: Record<Lang, typeof en> = { en, sw };
