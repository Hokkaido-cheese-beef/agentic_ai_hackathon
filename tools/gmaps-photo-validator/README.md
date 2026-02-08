# 住所/地名 → 写真 検証ツール（Go）

Google Maps Platform を使って「住所/地名 → Places 写真」を最小構成で検証するローカルツールです。

## できること
- Geocoding API で住所/地名 → 緯度経度を取得
- Places API (New) の Text Search で候補 place を取得（最大 5 件）
- Place Details (New) で `photos` を取得し、Place Photos (New) を表示（最大 5 枚）
- 写真ごとに author attribution を表示（無い場合は `no attribution`）
- API キー不足 / 権限不足 / レート制限 / 0 件などのエラーを画面に表示

## 必要な API（Google Cloud）
以下を有効化してください。
- Geocoding API
- Places API（New）

## セットアップ
### OAuth（ADC）利用
```bash
gcloud auth application-default login
export GOOGLE_MAPS_PROJECT_ID=YOUR_PROJECT_ID
```

### 任意でポートを変更する場合
```bash
export PORT=8080
```

## 起動
```bash
go run .
```

ブラウザで `http://localhost:8080` を開きます。

## 使い方
1. 住所/地名を入力して検索
2. Places 候補から `この place を選択` を押す
3. Place Photos を確認

## 動作確認クエリ例
- `東京駅`
- `東京都千代田区千代田1-1`

## 検証観点チェックリスト
- 住所だけで place が取れるか（候補が POI に寄るか）
- photos が取れる / 取れないケース
- attribution 表示の有無

## 備考
- 認証は `GOOGLE_MAPS_API_KEY` が設定されていれば API キー、未設定なら OAuth（ADC）を使います。
- OAuth 利用時は課金プロジェクト指定のため `GOOGLE_MAPS_PROJECT_ID`（または `GOOGLE_CLOUD_PROJECT`）が必要です。
- API キーはサーバ側のみで使用し、ブラウザには露出しません。
- Place Photos 画像は Go がプロキシして配信します。
- コスト抑制のため候補・写真枚数を制限しています（最大 5）。
