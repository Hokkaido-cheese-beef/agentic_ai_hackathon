/**
 * デモモード用初期データ
 */
import type { TripGroup, TripCandidate } from "@/types";
import { demoStore } from "./store";

const DEMO_GROUP_ID = "00000000-0000-0000-0000-000000000001";

export const demoTripGroup: TripGroup = {
  trip_group_id: DEMO_GROUP_ID,
  name: "関西・沖縄旅行プラン",
  departure: "東京",
  status: "active",
  created_at: new Date().toISOString(),
};

export const demoCandidates: TripCandidate[] = [
  {
    id: "00000000-0000-0000-0000-000000000101",
    trip_group_id: DEMO_GROUP_ID,
    name: "金閣寺",
    description: "世界文化遺産に登録された京都を代表する禅寺",
    image_url: null,
    tags: [
      { icon: "Landmark", label: "世界遺産", textColor: "#059669", iconColor: "#10B981", bgColor: "#ECFDF5" },
      { icon: "Clock", label: "所要1-2時間", textColor: "#D97706", iconColor: "#F59E0B", bgColor: "#FFFBEB" },
      { icon: "Wallet", label: "大人500円", textColor: "#2563EB", iconColor: "#3B82F6", bgColor: "#EFF6FF" },
    ],
    info: "正式名称は鹿苑寺。金箔で覆われた舎利殿が有名で、鏡湖池に映る姿は絶景です。室町時代の北山文化を代表する建築として知られています。",
    ai_summary: {
      headline: "金箔に輝く世界遺産 — 京都観光の定番",
      qa: [
        { q: "ベストシーズンはいつ？", a: "紅葉の11月下旬と雪景色の1-2月が特に美しいです。" },
        { q: "アクセスは？", a: "京都駅からバスで約40分。市バス205系統が便利です。" },
        { q: "周辺のおすすめは？", a: "龍安寺（徒歩15分）や仁和寺と合わせて回るのがおすすめです。" },
      ],
    },
    source_url: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000102",
    trip_group_id: DEMO_GROUP_ID,
    name: "美ら海水族館",
    description: "世界最大級の水槽を誇る沖縄の人気スポット",
    image_url: null,
    tags: [
      { icon: "Fish", label: "水族館", textColor: "#0891B2", iconColor: "#06B6D4", bgColor: "#ECFEFF" },
      { icon: "Baby", label: "子連れ◎", textColor: "#059669", iconColor: "#10B981", bgColor: "#ECFDF5" },
      { icon: "Clock", label: "所要3-4時間", textColor: "#D97706", iconColor: "#F59E0B", bgColor: "#FFFBEB" },
    ],
    info: "「黒潮の海」水槽ではジンベエザメやマンタが悠々と泳ぐ姿を間近で観察できます。イルカショーやウミガメ館も併設されており、一日中楽しめます。",
    ai_summary: {
      headline: "ジンベエザメに会える！沖縄No.1の体験型施設",
      qa: [
        { q: "混雑を避けるには？", a: "16時以降の入館がおすすめ。割引料金にもなります。" },
        { q: "所要時間は？", a: "じっくり見て3-4時間。海洋博公園全体なら半日は必要です。" },
        { q: "チケットはどこで買う？", a: "コンビニ前売りで割引あり。当日窓口は混雑します。" },
      ],
    },
    source_url: null,
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000103",
    trip_group_id: DEMO_GROUP_ID,
    name: "道頓堀",
    description: "グルメとエンターテインメントが集まる大阪の繁華街",
    image_url: null,
    tags: [
      { icon: "Utensils", label: "グルメ", textColor: "#DC2626", iconColor: "#EF4444", bgColor: "#FEF2F2" },
      { icon: "Camera", label: "フォトスポット", textColor: "#7C3AED", iconColor: "#8B5CF6", bgColor: "#F5F3FF" },
      { icon: "Wallet", label: "食べ歩き", textColor: "#2563EB", iconColor: "#3B82F6", bgColor: "#EFF6FF" },
    ],
    info: "グリコの看板やかに道楽など大阪を象徴する風景が続きます。たこ焼き、お好み焼き、串カツなど大阪グルメの食べ歩きが楽しめます。",
    ai_summary: {
      headline: "食い倒れの街 — 大阪グルメを満喫できる王道エリア",
      qa: [
        { q: "おすすめグルメは？", a: "たこ焼き（くくる）、串カツ（だるま）、お好み焼き（美津の）が三大定番です。" },
        { q: "いつ行くのがベスト？", a: "夜のネオンが映える18時以降がおすすめ。ただし週末は非常に混みます。" },
        { q: "周辺スポットは？", a: "心斎橋筋商店街（徒歩すぐ）や法善寺横丁も雰囲気があります。" },
      ],
    },
    source_url: null,
    created_at: new Date().toISOString(),
  },
];

/** ストアに初期データを投入 */
export function seedDemoData() {
  demoStore.addTripGroup(demoTripGroup);
  demoCandidates.forEach((c: TripCandidate) => demoStore.addCandidate(c));
}
