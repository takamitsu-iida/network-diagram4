# 5ステージCLOSネットワークを3Dで表示してみた

（このページはAdvent Calendar 2024向けに執筆したものです）

（このページはシンクライアント端末、仮想デスクトップではなくFAT PCで御覧ください）

<!--
1行目はは以下の記載

「この投稿は、JP - FNETS - server-p Advent Calendar 2024の＊＊日目の記事です。」と

Topicsに「AdventCalender2024」と「社内DX-SEデジタル革新」を付けてください。
-->

<br><br>

データセンターにおける大規模ネットワークのルーティング技術を調べる機会がありまして、
ベンダー独自の製品・機能について調べつつ、オープンな技術についても調査をしておりました。

この分野で調べを進めていきますと必然的に [RFC7938](https://datatracker.ietf.org/doc/html/rfc7938) *Use of BGP for Routing in Large-Scale Data Centers* を読むことになるのですが、
その中に書かれている図がこれ（↓）です。

<br>

```
                                      Tier 1
                                     +-----+
          Cluster                    |     |
 +----------------------------+   +--|     |--+
 |                            |   |  +-----+  |
 |                    Tier 2  |   |           |   Tier 2
 |                   +-----+  |   |  +-----+  |  +-----+
 |     +-------------| DEV |------+--|     |--+--|     |-------------+
 |     |       +-----|  C  |------+  |     |  +--|     |-----+       |
 |     |       |     +-----+  |      +-----+     +-----+     |       |
 |     |       |              |                              |       |
 |     |       |     +-----+  |      +-----+     +-----+     |       |
 |     | +-----------| DEV |------+  |     |  +--|     |-----------+ |
 |     | |     | +---|  D  |------+--|     |--+--|     |---+ |     | |
 |     | |     | |   +-----+  |   |  +-----+  |  +-----+   | |     | |
 |     | |     | |            |   |           |            | |     | |
 |   +-----+ +-----+          |   |  +-----+  |          +-----+ +-----+
 |   | DEV | | DEV |          |   +--|     |--+          |     | |     |
 |   |  A  | |  B  | Tier 3   |      |     |      Tier 3 |     | |     |
 |   +-----+ +-----+          |      +-----+             +-----+ +-----+
 |     | |     | |            |                            | |     | |
 |     O O     O O            |                            O O     O O
 |       Servers              |                              Servers
 +----------------------------+

                      Figure 3: 5-Stage Clos Topology
```

<br>

このような接続構成を**5ステージCLOSネットワーク**と呼びます（が、ここではどうでもいいです）。

本題は図の表現方法です。

テキストで表現した図としては、ものすごく分かりやすく描かれていると思うのですが、
さすがにパッと見ただけだと **何がどう繋がっているのか分かりづらい** です。

これだと冗長の系がどうなっているのかをたどるのも大変です。

もう少し可読性のある表現はできないものか、
と思いましてJavaScriptのライブラリCytoscape.jsを使って5ステージCLOSネットワークを表現してみました。

それがこれ（↓）です（画像クリックでライブデモ）。

<br>

| [![ScreenImage](./asset/network-diagram3.png)](https://takamitsu-iida.github.io/network-diagram3/) |
| --- |
| [Live Demo](https://takamitsu-iida.github.io/network-diagram3/) |

<br>

ライブデモ画面の左上 `Data1` をクリックして表示される構成は、Tier2-Tier3ルータだけで構成される単一クラスタです。

冗長の系を仮に0系-1系と呼ぶことにすると、緑が0系、オレンジが1系を表現しています。
色が付いたことでだいぶ見やすく、分かりやすくなっていると思います。

画面左上の `Data2` をクリックして表示される構成は、Tier1-Tier2-Tier3の5ステージCLOSネットワークです。

画面左上の `Data3` をクリックして表示される構成は、3クラスタの5ステージCLOSネットワークです。

この表現方法の場合、クラスタあたりのTier3ルータの数を増やすと画面の右側に伸びていき、
クラスタの数を増やすと画面の下に伸びていきます。

スクロールなしで1画面に表示できるルータの数はたかが知れています。

5ステージCLOSは大規模なネットワーク構成を想定しているのに　**画面上では小さな構成しか表現できない**　ことにモヤモヤしますよね。

<br>

# ３次元にしてみた

5ステージCLOSネットワークでは「クラスタの数 x クラスタあたりのTier3ルータの台数」でルータの総数が決まります。

たとえば（10クラスタ, 20台/クラスタ）の5ステージCLOSネットワークの場合、ルータの台数は224台、結線数は440本になります。

（20クラスタ, 30台/クラスタ）であれば、ルータの台数は664台、結線数は1,280本です。

（30クラスタ, 30台/クラスタ）ともなると、ルータは964台、結線数は1,920本にもなります。

このような **大規模なネットワーク構成を１画面に収めたい** というのが今回の趣旨です。

<br>

言葉で説明するより実際に見ていただいた方が早いですね。さっそく画面に表示してみましょう（画像クリックでライブデモ）。

<br>

> [!WARNING]
>
> このライブデモは **皆様のパソコンのCPU, GPUをかなり暖かくします** ので、ご注意ください。

<br>

| [![ScreenImage](./asset/index-nwdiagram.html.png)](https://takamitsu-iida.github.io/network-diagram4/index.html) |
| --- |
| [Live Demo](https://takamitsu-iida.github.io/network-diagram4/index.html) |

<br>

ライブデモ画面左上の　`(10, 20)`　`(20, 30)`　`(30, 30)`　をクリックしてネットワーク構成の規模を切り替えてみてください。

（30クラスタ, 30台/クラスタ）の構成を60FPS(フレーム/秒)で表示できた方は、とても良いPCをお持ちの方です。

私が使っている少々古いIntel CPUのMacbook Proでは60FPS出せませんでした。

会社で使っているノートパソコンではなんとか60FPSで表示できるものの、ルータのラベルを表示するとかなり厳しい感じに。

M2のMac miniであれば余裕をもって表示できました。

<br>

また、ライブデモ画面上部のLayoutの部分で　`Circular`　`Sphere`　`Grid`　を切り替えてみてください。

同じ構成でもルータの配置を変えると視認性はずいぶん変わります。

5ステージCLOSのように同じ構成が並ぶだけであれば、レイアウト決定は規模に関係なく容易に実装できますが、
パターン化されていない構成では複雑なロジックが必要になります。

自分が管理するネットワークでそういったレイアウト決定アルゴリズムを考えて3D表示してみるのも楽しいかもしれませんね。

<br>

# まとめ

３次元表示は、画面で編集操作をするのが難しい、という弱点もありますが、
そのような必要性がないような使い方、
たとえば監視画面のような使い方にはとても向いていると思います。

可視化している元データは（離散数学でいうところの）グラフですので、
最短経路の可視化や、障害発生時の影響箇所の可視化なんかもできそうですし、
パッと見ただけで多くのノードを視認できる、というメリットを活かせる場面は他にもいろいろあるかもしれません。

<br><br><br><br>

# おまけ

前述のライブデモはThree.jsを使って作成したもので、
GPUを意識することなくJavaScriptだけで3Dプログラミングを実現できています。

ですが、GLSLというシェーダー言語を組み合わせると、意図的にGPUを使うこともできます。

**もっとPCを温めたい** という方のために、GPUを使った作例を2つ紹介します。

<br><br>

## 風の動きをGPUで計算して描画する例

約5万個のパーティクル（点）を風のベクトルに沿って動かします。

JavaScriptでパーティクルの位置を計算すると、せいぜい数千個のパーティクルを動かすのが限界です。
JavaScriptはシングルスレッドで動きますので、パーティクルの位置を順番に計算していく都合上、
数に比例して時間を要してしまうからです。
一方、GPUを使う場合は全てのパーティクルの位置を同時に計算できますので、
計算時間を飛躍的に短縮できます。

私は手漕ぎボートで海に浮かんで釣りをするのが趣味なので、週末が近づくと風予報が気になって仕方ありません。
自分でも、風の可視化ができないかな、と思って作りました。
Windyのように美しく表現するには美的センスが必要なので、残念ながら私にはキレイに作れませんでしたが、
GPUを使って計算するそのやり方は、いろんなところに応用できると思います。

<br>

| [![ScreenImage](./asset/index-gpgpu-move-along-wind5.html.png)](https://takamitsu-iida.github.io/threejs-practice/index-gpgpu-move-along-wind5.html) |
| --- |
| [Live Demo](https://takamitsu-iida.github.io/threejs-practice/index-gpgpu-move-along-wind5.html) |

<br><br>

## 線の位置をGPUで計算して描画する例

地球儀上の都市間をランダムに結ぶ曲線を描画します。

基本的なやり方は前述の風の可視化と同じで、
約5万個の点の位置をフレームごとにGPUで計算しています（ベジエ曲線を構成する点の位置を変えることで線が動いて見えます）。

IPアドレスと地図上の位置を紐づけるGeoIPと組み合わせたらおもしろい可視化表現ができるかも、と思って作りましたが、思ったほど美しくなかったので放置しています。

<br>

| [![ScreenImage](./asset/index-load-geojson4.html.png)](https://takamitsu-iida.github.io/threejs-practice/index-load-geojson4.html) |
| --- |
| [Live Demo](https://takamitsu-iida.github.io/threejs-practice/index-load-geojson4.html) |


<br><br>

# おまけのまとめ

GPUはすごい。

あと、美的センスはとても大事。
