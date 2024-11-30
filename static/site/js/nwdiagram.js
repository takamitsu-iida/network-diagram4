import * as THREE from "three";

// マウス操作
import { OrbitControls } from 'three/controls/OrbitControls.js';

// CSS2DRendererを用いたラベル表示
// 参考 https://github.com/mrdoob/three.js/blob/master/examples/css2d_label.html
import { CSS2DRenderer, CSS2DObject } from 'three/libs/CSS2DRenderer.js';

// lil-gui
import { GUI } from "three/libs/lil-gui.module.min.js";

// stats.js
import Stats from 'three/libs/stats.module.js';


export class ObjectSelection {

  // 参照
  // 初めてのThree.js 第二版 P235
  // https://github.com/oreilly-japan/learning-three-js-2e-ja-support

  // コンストラクタに渡されるパラメータ
  params = {};

  // 光線が当たっているオブジェクトへの参照
  INTERSECTED = null;

  // マウスカーソルが上に乗ったときのコールバック関数
  callbackMouseover;

  // マウスをクリックしたときのコールバック関数
  callbackClick;

  // マウス位置
  mousePosition;  // = new THREE.Vector2()
  previousMousePosition;  // = new THREE.Vector2()

  // スクリーン上のDOM要素
  domElement;

  // 光線を飛ばすレイキャスター
  raycaster; // = new THREE.Raycaster();

  // 光線を飛ばす対象レイヤ
  layers; // = [];

  constructor(params = {}) {
    this.params = Object.assign(this.params, params);

    // マウスカーソルが上に乗ったときのコールバック関数
    this.callbackMouseover = this.params.hasOwnProperty("mouseover") ? this.params.mouseover : null;

    // マウスをクリックしたときのコールバック関数
    this.callbackClick = this.params.hasOwnProperty("click") ? this.params.click : null;

    // 対象レイヤ
    this.layers = this.params.hasOwnProperty("layers") ? this.params.layers : [];

    // スクリーン上のDOM要素
    this.domElement = this.params.hasOwnProperty("domElement") ? this.params.domElement : document;

    // マウス位置
    this.mousePosition = new THREE.Vector2();
    this.previousMousePosition = new THREE.Vector2();

    // mousemoveイベントを登録
    this.domElement.addEventListener('mousemove', this.onMouseMove, false);

    // clickイベントを登録
    this.domElement.addEventListener('click', this.onMouseClick, false);

    // レイキャスターを作成
    this.raycaster = new THREE.Raycaster();

    // レイキャスターが対象にするレイヤーを指定
    this.layers.forEach((layer) => {
      this.raycaster.layers.enable(layer);
    });

  }

  onMouseMove = (event) => {
    event.preventDefault();
    event.stopPropagation();

    // DOM要素(canvas)を取得する
    // これはeventから取得してもよいし、paramsで渡されたものを使ってもよい
    // const element = this.domElement;
    const element = event.currentTarget;

    // その要素の位置を取得
    const clientRect = element.getBoundingClientRect();

    // canvas要素の左上を起点とするマウス座標
    const x = event.clientX - clientRect.x;
    const y = event.clientY - clientRect.y;

    // canvas要素の幅、高さ (paddingが含まれるのでCSSで0にしておくこと)
    const w = element.clientWidth;
    const h = element.clientHeight;

    // マウス座標を(-1, 1)の範囲に変換
    this.mousePosition.x = +(x / w) * 2 - 1;
    this.mousePosition.y = -(y / h) * 2 + 1;
  }


  onMouseClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (this.INTERSECTED) {
      if (typeof this.callbackClick === 'function') {
        this.callbackClick(this.INTERSECTED);
      }
    }
  }


  // animate()の中でこのrender()関数を呼ぶこと
  render = (scene, camera) => {
    // マウス座標が変わっていないなら何もしない
    if (this.mousePosition.equals(this.previousMousePosition)) {
      return;
    }

    // 1フレーム前のマウス座標を保存
    this.previousMousePosition.copy(this.mousePosition);

    // カメラからマウス座標に向かって光線を飛ばす
    this.raycaster.setFromCamera(this.mousePosition, camera);

    // オブジェクトに光線がぶつかっているか、判定する
    const intersects = this.raycaster.intersectObject(scene, true);

    // 光線がオブジェクトにぶつかっていて、それが選択可能なものであれば、
    if (intersects.length > 0 && intersects[0].object.selectable) {

      // 前回と違うオブジェクトに光線が当たっているなら、
      if (this.INTERSECTED != intersects[0].object) {

        // 前回のオブジェクトは元の色に戻す
        if (this.INTERSECTED) {
          if (this.INTERSECTED.material.color) {
            this.INTERSECTED.material.color.setHex(this.INTERSECTED.currentHex);
            this.INTERSECTED.material.needsUpdate = true;
          }
        }

        // 新しいオブジェクトを選択して、
        this.INTERSECTED = intersects[0].object;

        // そのオブジェクトに色の属性があるなら、
        if (this.INTERSECTED.material.color) {
          // 現在の色をオブジェクト内に保存して、
          this.INTERSECTED.currentHex = this.INTERSECTED.material.color.getHex();

          // 色を変える
          this.INTERSECTED.material.color.setHex(0xff0000);
          this.INTERSECTED.material.needsUpdate = true;
        }

        // コールバック関数を渡されているならそれを実行する
        if (typeof this.callbackMouseover === 'function') {
          this.callbackMouseover(this.INTERSECTED);
        }
      }

    } else {
      // 光線がオブジェクトにぶつかっていないなら

      // 古いオブジェクトは元の色に戻す
      if (this.INTERSECTED) {
        if (this.INTERSECTED.material.color) {
          this.INTERSECTED.material.color.setHex(this.INTERSECTED.currentHex);
          this.INTERSECTED.material.needsUpdate = true;
        }
      }

      // 選択を外して
      this.INTERSECTED = null;

      // 選択から外れたことをコールバック関数で知らせる
      if (typeof this.callbackMouseover === 'function') {
        this.callbackMouseover(null);
      }

    }
  };
}


//
// 2024.07.25 CSS2DRenderer.jsを利用することにしたので使っていないが、
// こっちの方が性能がよければ復活させる
//
class __CanvasLabel {

  params;

  labelName;
  labelText;
  labelLayer;

  constructor(params = {}) {
    this.params = Object.assign(this.params, params);

    this.labelName = this.params.hasOwnProperty("labelName") ? this.params.labelName : "";
    this.labelText = this.params.hasOwnProperty("labelText") ? this.params.labelText : "";
    this.labelLayer = this.params.hasOwnProperty("labelLayer") ? this.params.labelLayer : 1; // 指定がない場合はレイヤ 1 に設定

    if (!this.labelName) {
      throw new Error("labelName must be specified");
    }
  }


  create = () => {

    const canvas = document.createElement("canvas");

    const ctx = canvas.getContext("2d");

    // canvasのデフォルトフォントは "10px sans-serif"
    // フォントを大きく、Arialに
    const fontSize = 40;
    ctx.font = `${fontSize}px Arial`;

    // measureTextで必要な幅を調べる
    const width = ctx.measureText(this.labelText).width;

    // canvasのサイズを必要な幅に設定
    canvas.setAttribute('width', width);

    // canvasの幅を変更したので、再度フォントの設定を行う
    ctx.font = `${fontSize}pt Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.textBaseline = 'top';
    ctx.fillText(this.labelText, 0, 0);

    // (width, height, depth)
    const geometry = new THREE.BoxGeometry(width, 100, 0);

    const material = new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(
        canvas,
        THREE.UVMapping,
        THREE.ClampToEdgeWrapping,
        THREE.ClampToEdgeWrapping,
        THREE.LinearFilter,
        THREE.LinearFilter
      ),
      transparent: true,
      opacity: 0.6
    });
    material.map.needsUpdate = true;

    // set text canvas to cube geometry
    const label = new THREE.Mesh(geometry, material);

    // このオブジェクトに名前を設定しておく
    label.name = this.labelName;

    // ラベルはレイヤ 1 に設定
    label.layers.set(this.labelLayer);

    return label;
  }

}


//
// グラフを表現するクラス
//
export class Graph {

  nodes = [];
  edges = [];

  constructor(elements) {

    let eles;
    if (elements === undefined || elements === null) {
      eles = [];
    } else if (typeof elements === "object") {
      eles = [elements];
    }

    eles.forEach((ele) => {
      if ("data" in ele === false || "id" in ele.data === false) {
        throw new Error("element.data.id is required");
      }
      if ("source" in ele.data && "target" in ele.data) {
        this.addEdge(ele);
      } else {
        this.addNode(ele);
      }
    });
  }

  addNode = (node) => {
    if ("data" in node === false || "id" in node.data === false) {
      throw new Error("node.data.id is required");
    }
    if ("group" in node === false) {
      node["group"] = "nodes";
    }
    this.nodes.push(node);
  }

  addEdge = (edge) => {
    if ("data" in edge === false || "id" in edge.data === false) {
      throw new Error("edge.data.id is required");
    }
    if ("group" in edge === false) {
      edge["group"] = "edges"
    }

    this.edges.push(edge);
  }

  getNodes = () => {
    return this.nodes;
  }

  getEdges = () => {
    return this.edges;
  }

  getElements = () => {
    return this.nodes.concat(this.edges);
  }

  getElementById = (id) => {
    {
      const found = this.nodes.find((node) => node.data.id === id);
      if (found) {
        return found;
      }
    }
    {
      const found = this.edges.find((edge) => edge.data.id === id);
      if (found) {
        return found;
      }
    }
    return null;
  }

}


const CLUSTERS_EXAMPLE_1 = [
  { clusterId: 1, numTier3: 20 },
  { clusterId: 2, numTier3: 20 },
  { clusterId: 3, numTier3: 20 },
  { clusterId: 4, numTier3: 20 },
  { clusterId: 5, numTier3: 20 },
  { clusterId: 6, numTier3: 20 },
  { clusterId: 7, numTier3: 20 },
  { clusterId: 8, numTier3: 20 },
  { clusterId: 9, numTier3: 20 },
  { clusterId: 10, numTier3: 20 }
];


const CLUSTERS_EXAMPLE_2 = [
  { clusterId: 1, numTier3: 30 },
  { clusterId: 2, numTier3: 30 },
  { clusterId: 3, numTier3: 30 },
  { clusterId: 4, numTier3: 30 },
  { clusterId: 5, numTier3: 30 },
  { clusterId: 6, numTier3: 30 },
  { clusterId: 7, numTier3: 30 },
  { clusterId: 8, numTier3: 30 },
  { clusterId: 9, numTier3: 30 },
  { clusterId: 10, numTier3: 30 },
  { clusterId: 11, numTier3: 30 },
  { clusterId: 12, numTier3: 30 },
  { clusterId: 13, numTier3: 30 },
  { clusterId: 14, numTier3: 30 },
  { clusterId: 15, numTier3: 30 },
  { clusterId: 16, numTier3: 30 },
  { clusterId: 17, numTier3: 30 },
  { clusterId: 18, numTier3: 30 },
  { clusterId: 19, numTier3: 30 },
  { clusterId: 20, numTier3: 30 }
];


const CLUSTERS_EXAMPLE_3 = [
  { clusterId: 1, numTier3: 30 },
  { clusterId: 2, numTier3: 30 },
  { clusterId: 3, numTier3: 30 },
  { clusterId: 4, numTier3: 30 },
  { clusterId: 5, numTier3: 30 },
  { clusterId: 6, numTier3: 30 },
  { clusterId: 7, numTier3: 30 },
  { clusterId: 8, numTier3: 30 },
  { clusterId: 9, numTier3: 30 },
  { clusterId: 10, numTier3: 30 },
  { clusterId: 11, numTier3: 30 },
  { clusterId: 12, numTier3: 30 },
  { clusterId: 13, numTier3: 30 },
  { clusterId: 14, numTier3: 30 },
  { clusterId: 15, numTier3: 30 },
  { clusterId: 16, numTier3: 30 },
  { clusterId: 17, numTier3: 30 },
  { clusterId: 18, numTier3: 30 },
  { clusterId: 19, numTier3: 30 },
  { clusterId: 20, numTier3: 30 },
  { clusterId: 21, numTier3: 30 },
  { clusterId: 22, numTier3: 30 },
  { clusterId: 23, numTier3: 30 },
  { clusterId: 24, numTier3: 30 },
  { clusterId: 25, numTier3: 30 },
  { clusterId: 26, numTier3: 30 },
  { clusterId: 27, numTier3: 30 },
  { clusterId: 28, numTier3: 30 },
  { clusterId: 29, numTier3: 30 },
  { clusterId: 30, numTier3: 30 }
];


export function createSampleGraph(options) {
  options = options || {}
  const clusters = options.hasOwnProperty("clusters") ? options.clusters : CLUSTERS_EXAMPLE_1;
  const layout = options.hasOwnProperty("layout") ? options.layout : "circular";

  const fiveStageClosGraph = new FiveStageClosGraph({
    clusters: clusters,
    layout: layout
  });

  return fiveStageClosGraph.getGraph();
}


export class FiveStageClosGraph {

  clusters;
  /*
  入力に渡されるデータclustersは、このようなものを想定
  clusters = [
    {
      clusterId: 1,
      numTier3: 10
    }
  ];
  */

  // Graphクラスのインスタンス、最後にこれを返す
  graph;

  // 初期オプションは引数で上書きされうる
  options = {
    clusters: CLUSTERS_EXAMPLE_1,
    layout: "circular",  // "circular" or "sphere"
  };


  constructor(options = {}) {
    this.options = Object.assign(this.options, options);

    this.clusters = this.options.clusters;
    this.layout = this.options.layout;

    // 空のGraphインスタンスを作成
    this.graph = new Graph();

    // ノードとエッジを作成してgraphに追加
    this.createNodeEdge();

    console.log(`(nodes, edges) = (${this.graph.nodes.length}, ${this.graph.edges.length})`);

    // レイアウトを計算
    this.calcLayout();

    // レイアウトを設定
    this.setLayout(this.layout);
  }


  getGraph = () => {
    return this.graph;
  }


  createNodeEdge = () => {

    // 各クラスタについて
    this.clusters.forEach((cluster, index) => {

      // clusterIdとnumTier3を取り出しておく
      const clusterId = cluster.clusterId;
      const numTier3 = cluster.numTier3;

      // tier3のノードを指定された数だけ作成
      for (let i = 0; i < numTier3; i++) {
        const nodeId = `c${clusterId}_t3_${i}`;
        const node = {
          group: 'nodes',
          data: {
            id: nodeId,
            label: nodeId,
            clusterId: clusterId,
            tier: 3,
            // 事前に位置を決めておく
            positions: {
              circular: { x: 0, y: 0, z: 0 },
              sphere: { x: 0, y: 0, z: 0 }
            }
          },
          position: { x: 0, y: 0, z: 0 }
        };
        this.graph.addNode(node);
      }

      // tier2のノードには 0系, 1系 を追加
      for (let i = 0; i < 2; i++) {
        const nodeId = `c${clusterId}_t2_${i}`;
        const node = {
          group: 'nodes',
          data: {
            id: nodeId,
            label: nodeId,
            clusterId: clusterId,
            tier: 2,
            redundantId: i, // 0系, 1系
            //
            positions: {
              circular: { x: 0, y: 0, z: 0 },
              sphere: { x: 0, y: 0, z: 0 }
            }
          },
          position: { x: 0, y: 0, z: 0 }
        };
        this.graph.addNode(node);

        // このtier2ノードからtier3ノードに向かうエッジを追加
        for (let j = 0; j < numTier3; j++) {
          const tier3NodeId = `c${clusterId}_t3_${j}`;
          const edge = {
            group: 'edges',
            data: {
              id: `edge_${nodeId}_${tier3NodeId}`,
              source: nodeId,
              target: tier3NodeId,
              redundantId: i // 0系, 1系
            }
          };
          this.graph.addEdge(edge);
        }
      }
    });

    // tier1のノードを追加
    // 0系で2台、1系で2台、合計4台
    for (let i = 0; i < 4; i++) {
      const nodeId = `t1_${i}`;

      // 0系, 1系の定義
      // const redundantId = i < 2 ? 0 : 1;
      const redundantId = i % 2;

      const node = {
        group: 'nodes',
        data: {
          id: nodeId,
          label: nodeId,
          tier: 1,
          redundantId: redundantId,
          //
          positions: {
            circular: { x: 0, y: 0, z: 0 },
            sphere: { x: 0, y: 0, z: 0 }
          }
        },
        position: { x: 0, y: 0, z: 0 }
      };
      this.graph.addNode(node);

      // このtier1ノードからtier2ノードに向かうエッジを追加
      this.clusters.forEach((cluster, index) => {
        const clusterId = cluster.clusterId;
        const tier2NodeId = `c${clusterId}_t2_${redundantId}`;
        const edge = {
          group: 'edges',
          data: {
            id: `edge_${nodeId}_${tier2NodeId}`,
            source: nodeId,
            target: tier2NodeId,
            redundantId: redundantId
          },
          position: { x: 0, y: 0, z: 0 }
        }
        this.graph.addEdge(edge);
      });
    }
  }

  calcLayout() {
    this.sphereLayout();
    this.circularLayout();
    this.gridLayout();
  }

  setLayout(layout) {
    this.layout = layout;

    this.graph.nodes.forEach((node) => {
      const position = node.data.positions[this.layout];
      node.position.x = position.x;
      node.position.y = position.y;
      node.position.z = position.z;
    });
  }


  circularLayout = (options) => {
    options = options || {};

    let tier3Radius = 240;
    tier3Radius = options.hasOwnProperty("tier3Radius") ? options.tier3Radius : tier3Radius;

    let tier3Interval = 15;
    tier3Interval = options.hasOwnProperty("tier3Interval") ? options.tier3Interval : tier3Interval;

    let tier2Radius = 380;
    tier2Radius = options.hasOwnProperty("tier2Radius") ? options.tier2Radius : tier2Radius;

    let tier2Height = 100;
    tier2Height = options.hasOwnProperty("tier2Height") ? options.tier2Height : tier2Height;

    let tier1Radius = 100;
    tier1Radius = options.hasOwnProperty("tier1Radius") ? options.tier1Radius : tier1Radius;

    let tier1Height = tier2Height + 150;
    tier1Height = options.hasOwnProperty("tier1Height") ? options.tier1Height : tier1Height;

    // クラスタの数
    const numClusters = this.clusters.length;

    // クラスタを放射線状に配置するときの角度
    const tier3Theta = 2 * Math.PI / numClusters;

    // 各クラスタについて
    this.clusters.forEach((cluster, index) => {

      // clusterIdとnumTier3を取り出しておく
      const clusterId = cluster.clusterId;
      const numTier3 = cluster.numTier3;

      // 何番目のクラスタか、によって放射線状に配置する角度を決める
      const theta = tier3Theta * index;

      // tier3のノードの位置を決める
      for (let i = 0; i < numTier3; i++) {
        const nodeId = `c${clusterId}_t3_${i}`;
        const radius = tier3Radius + tier3Interval * i;
        const x = radius * Math.cos(theta);
        const y = 0;
        const z = radius * Math.sin(theta);
        const n = this.graph.getElementById(nodeId);
        if (n) {
          n.data.positions.circular = { x, y, z };
        }
      }

      // tier2のノードの位置を決める
      for (let i = 0; i < 2; i++) {
        const nodeId = `c${clusterId}_t2_${i}`;
        const radius = tier2Radius;
        const x = radius * Math.cos(theta);
        const y = (i === 0) ? tier2Height : -tier2Height;
        const z = radius * Math.sin(theta);
        const n = this.graph.getElementById(nodeId);
        if (n) {
          n.data.positions.circular = { x, y, z };
        }
      }

    });

    // tier1のノードの位置を決める
    for (let i = 0; i < 4; i++) {
      const nodeId = `t1_${i}`;
      const radius = tier1Radius;
      const tier1Theta = 2 * Math.PI / 4;
      const theta = tier1Theta * i;
      const x = radius * Math.cos(theta);
      const y = (i % 2 === 0) ? tier1Height : -1 * tier1Height;
      const z = radius * Math.sin(theta);
      const n = this.graph.getElementById(nodeId);
      if (n) {
        n.data.positions.circular = { x, y, z };
      }
    }

    return this;
  }


  sphereLayout = (options) => {
    options = options || {};

    let tier3Radius = 340;
    tier3Radius = options.hasOwnProperty("tier3Radius") ? options.tier3Radius : tier3Radius;

    let tier2Radius = 160;
    tier2Radius = options.hasOwnProperty("tier2Radius") ? options.tier2Radius : tier2Radius;

    let tier1Radius = 40;
    tier1Radius = options.hasOwnProperty("tier1Radius") ? options.tier1Radius : tier1Radius;

    let tier1Height = 160;
    tier1Height = options.hasOwnProperty("tier1Height") ? options.tier1Height : tier1Height;

    // クラスタの数
    const numClusters = this.clusters.length;

    // クラスタを放射線状に配置するときの角度
    const tier3Theta = 2 * Math.PI / numClusters;

    // 一時変数
    const vec3 = new THREE.Vector3();

    // 各クラスタについて
    this.clusters.forEach((cluster, index) => {

      // clusterIdとnumTier3を取り出しておく
      const clusterId = cluster.clusterId;
      const numTier3 = cluster.numTier3;

      // 何番目のクラスタか、によって放射線状に配置する角度を決める
      const theta = tier3Theta * index;

      // Tier3ノードを配置する極角度を決める
      const tier3Phi = (Math.PI * 0.9) / (numTier3 + 1);

      // tier3のノードの位置を決める
      for (let i = 0; i < numTier3; i++) {
        const nodeId = `c${clusterId}_t3_${i}`;

        // 極角度
        const phi = Math.PI * 0.05 + tier3Phi * (i + 1);

        // 位置を決める
        vec3.setFromSphericalCoords(tier3Radius, phi, theta);

        const n = this.graph.getElementById(nodeId);
        if (n) {
          n.data.positions.sphere = { x: vec3.x, y: vec3.y, z: vec3.z };
        }
      }

      // Tier2ノードを配置する極角度を決める
      const tier2Phi = Math.PI / 3;

      // tier2のノードの位置を決める
      for (let i = 0; i < 2; i++) {
        const nodeId = `c${clusterId}_t2_${i}`;

        // 極角度
        const phi = tier2Phi * (i + 1);

        // 位置を決める
        vec3.setFromSphericalCoords(tier2Radius, phi, theta);

        const n = this.graph.getElementById(nodeId);
        if (n) {
          n.data.positions.sphere = { x: vec3.x, y: vec3.y, z: vec3.z };
        }
      }
    });

    // tier1のノードの位置を決める
    for (let i = 0; i < 4; i++) {
      const nodeId = `t1_${i}`;
      const radius = tier1Radius;
      const tier1Theta = 2 * Math.PI / 4;
      const theta = tier1Theta * i;
      const x = radius * Math.cos(theta);
      const y = (i % 2 === 0) ? tier1Height : -1 * tier1Height;
      const z = radius * Math.sin(theta);
      const n = this.graph.getElementById(nodeId);
      if (n) {
        n.data.positions.sphere = { x, y, z };
      }
    }

    return this;
  }


  gridLayout = (options) => {
    options = options || {};

    // Tier3を列に並べるときの列間隔
    const clusterGap = options.hasOwnProperty("clusterGap") ? options.clusterGap : 30;

    // Tier3ノード同士の間隔
    const tier3Gap = options.hasOwnProperty("tier3Gap") ? options.tier3Gap : 30;

    // tier2ノードのY座標
    const tier2Y = options.hasOwnProperty("tier2Y") ? options.tier2Y : 120;

    // tier1ノードのY座標
    const tier1Y = options.hasOwnProperty("tier1Y") ? options.tier1Y : 240;

    // tier1ノード同士の間隔
    const tier1Gap = options.hasOwnProperty("tier1Gap") ? options.tier1Gap : 90;

    // クラスタの数
    const numClusters = this.clusters.length;

    // 各クラスタについて
    this.clusters.forEach((cluster, index) => {

      // clusterIdとnumTier3を取り出しておく
      const clusterId = cluster.clusterId;

      // tier3のノードの数
      const numTier3 = cluster.numTier3;

      // X座標
      const x = clusterGap * index - clusterGap * (numClusters - 1) / 2;

      // Y座標
      const y = 0;

      for (let i = 0; i < numTier3; i++) {
        const nodeId = `c${clusterId}_t3_${i}`;

        // Z座標
        const z = tier3Gap * i - tier3Gap * (numTier3 - 1) / 2;

        const n = this.graph.getElementById(nodeId);
        if (n) {
          n.data.positions.grid = { x: x, y: y, z: z };
        }
      }

      // Tier2ノードの位置を決める
      for (let i = 0; i < 2; i++) {
        const nodeId = `c${clusterId}_t2_${i}`;

        // Z座標
        const z = -1 * tier3Gap * (numTier3 - 1) / 2 + i * (numTier3 - 1) * tier3Gap;

        const n = this.graph.getElementById(nodeId);
        if (n) {
          n.data.positions.grid = { x: x, y: tier2Y, z: z };
        }
      }
    });

    // tier1のノードの位置を決める
    for (let i = 0; i < 4; i++) {
      const nodeId = `t1_${i}`;
      const x = tier1Gap * i - tier1Gap * 1.5;
      const y = tier1Y;
      const z = 0;

      const n = this.graph.getElementById(nodeId);
      if (n) {
        n.data.positions.grid = { x, y, z };
      }
    }

    return this;
  }


}


// レイヤー定義
export class LAYERS {
  static LABEL = 1;
  static REDUNDANT_0 = 2;
  static REDUNDANT_1 = 3;
}


// ノードとエッジの色定義
export class NODE_COLORS {
  static DEFAULT = 0xF0F0F0;     // light gray
  static REDUNDANT_0 = 0x00CC00; // green
  static REDUNDANT_1 = 0xFFCC00; // orange
}


class Node extends THREE.Group {

  // ノードを表現するメッシュ
  sphere;

  // ノードの透明度（Tierによって変える）
  sphereOpacity = 1.0;
  sphereColor = 0xf0f0f0;

  // 20面体の半径
  sphereRadius = 6.0;

  // 20面体の詳細度、3にするとほぼ球になる
  sphereDetail = 3;

  // 注目を集めるためのコーン型のメッシュ、選択中のみ表示する
  cone;

  // ラベル表示用のCSS2DObject
  label;

  // 元になったグラフのノードのデータ
  node;

  // 選択状態
  isSelected = false;

  constructor(node, options) {

    super();

    options = options || {}

    // ノードのデータを保持しておく
    this.node = node;

    // グループに名前を設定
    this.name = `${this.node.data.id}_group`

    // 位置を設定
    this.position.set(this.node.position.x, this.node.position.y, this.node.position.z);

    //
    // ノード本体を表現する20面体を作成
    //
    {
      // Tier1によって色を変える
      this.sphereColor = NODE_COLORS.DEFAULT;
      if (node.data.hasOwnProperty("redundantId")) {
        this.sphereColor = node.data.redundantId === 0 ? NODE_COLORS.REDUNDANT_0 : NODE_COLORS.REDUNDANT_1;
      }

      // 20面体のジオメトリを作成
      // (radius : Float, detail : Integer) を指定して作成する

      // 半径はノードのTierによって変える
      this.sphereRadius = options.hasOwnProperty("sphereRadius") ? options.sphereRadius : this.sphereRadius;
      const tier = this.node.data.hasOwnProperty("tier") ? this.node.data.tier : 3;
      if (tier === 1) {
        this.sphereRadius *= 3.0;
      } else if (tier === 2) {
        this.sphereRadius *= 1.6;
      }

      this.sphereDetail = options.hasOwnProperty("sphereDetail") ? options.sphereDetail : this.sphereDetail;

      // ジオメトリ
      const geometry = new THREE.IcosahedronGeometry(this.sphereRadius, this.sphereDetail);

      // マテリアルを作成

      // MeshBasicMaterialは光源に反応せず平面的に描画する
      // const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xe0e0e0, opacity: 0.8 });

      // MeshNormalMaterialはxyz軸の色に合わせて面の色も変化する(x=青、y=緑、z=赤)
      // 色の変化は光源によるものではなく、面の法線ベクトルによるもの
      // const material = new THREE.MeshNormalMaterial({transparent: true, opacity: 0.5});

      // MeshLambertMaterialは光源に反応する
      // const material = new THREE.MeshLambertMaterial({ color: color, opacity: 1.0 });

      let material;
      if (this.node.data.hasOwnProperty("tier") && this.node.data.tier !== 3) {
        this.sphereOpacity = 1.0;
        material = new THREE.MeshLambertMaterial({
          transparent: true,
          opacity: this.sphereOpacity,
          color: this.sphereColor,
          depthTest: true  // オブジェクト内部の線を隠すための設定
        });
      } else {
        this.sphereOpacity = 0.75;
        material = new THREE.MeshNormalMaterial({
          transparent: true,
          opacity: this.sphereOpacity,
          depthTest: true  // オブジェクト内部の線を隠すための設定
        });
      }

      // メッシュを作成
      this.sphere = new THREE.Mesh(geometry, material);

      // 名前を設定
      this.sphere.name = node.data.id;

      // 選択可能にする
      this.sphere.selectable = true;

      // 選択状態
      this.sphere.selected = false;

      // redundantIdにあわせてレイヤーを設定
      if (this.node.data.hasOwnProperty("redundantId")) {
        if (this.node.data.redundantId === 0) {
          this.sphere.layers.set(LAYERS.REDUNDANT_0);
        } else if (this.node.data.redundantId === 1) {
          this.sphere.layers.set(LAYERS.REDUNDANT_1);
        }
      }

      // グループに追加
      this.add(this.sphere);
    }

    //
    // ラベルを作成(CSS2DObject)
    //
    {
      // DOM要素を作成
      const div = document.createElement('div');

      // CSSクラスを設定
      div.className = 'label';

      // CSSクラスを追加
      const labelFontSize = options.hasOwnProperty("labelFontSize") ? options.labelFontSize : "Medium";
      div.classList.add(labelFontSize.toLowerCase());

      // テキストを設定
      div.textContent = node.data.label || node.data.id;

      // CSS2DObjectを作成
      this.label = new CSS2DObject(div);

      // 名前を設定
      this.label.name = `${node.data.id}_label`;

      // 親になるノードからの相対で位置を設定
      this.label.position.set(0, 15, 0);

      // ラベル用のレイヤーに設定 == 1
      this.label.layers.set(LAYERS.LABEL);

      // グループに追加
      this.add(this.label);
    }

    //
    // 注目を集めるためのConeGeometryを追加する
    //
    {
      // ConeGeometryを作成
      const coneRadius = options.hasOwnProperty("coneRadius") ? options.coneRadius : 6;
      const coneHeight = options.hasOwnProperty("coneHeight") ? options.coneHeight : 12;
      const coneSegments = options.hasOwnProperty("coneSegments") ? options.coneSegments : 32;
      const geometry = new THREE.ConeGeometry(coneRadius, coneHeight, coneSegments);

      // マテリアルを作成
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

      // メッシュを作成
      this.cone = new THREE.Mesh(geometry, material);
      this.cone.name = `${node.data.id}_cone`;
      this.cone.rotateX(Math.PI);
      this.cone.position.set(0, this.sphereRadius + coneHeight / 2, 0);
      this.cone.visible = false;
      this.add(this.cone);
    }
  }


  updatePosition = () => {
    this.position.set(this.node.position.x, this.node.position.y, this.node.position.z);
  }


  // ブリンクエフェクト
  // 色で制御するとマウスオーバーの色制御と競合するのでopacityを制御する
  blinkOpacity = 0.4;
  blinkInterval;
  blinkEffect = () => {
    // 選択中なら、ブリンクエフェクトを開始
    if (this.isSelected) {
      this.blinkInterval = setInterval(() => {
        if (this.sphere.material.opacity === this.blinkOpacity) {
          this.sphere.material.opacity = this.sphereOpacity;
        } else {
          this.sphere.material.opacity = this.blinkOpacity;
        }
      }, 500);
    } else {
      // ブリンクエフェクトを停止
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
      this.sphere.material.opacity = this.sphereOpacity;
    }
  }

}


class Edge extends THREE.Group {

  // ラインを表現するメッシュ
  line;

  // 元になったグラフのエッジのデータ
  edge;

  // 位置を決めるためにsourceとtargetの情報をもらう
  constructor(edge, source, target, options) {

    super();

    // グラフのエッジ情報を保持しておく
    this.edge = edge;
    this.source = source;
    this.target = target;

    // オプション情報を保持しておく
    this.options = options || {};

    // 冗長系によって色を変える
    let lineColor = NODE_COLORS.DEFAULT;
    if (this.edge.data.hasOwnProperty("redundantId")) {
      lineColor = edge.data.redundantId === 0 ? NODE_COLORS.REDUNDANT_0 : NODE_COLORS.REDUNDANT_1;
    }

    // グループに名前を設定
    this.name = `${this.edge.data.id}_group`

    // 線のジオメトリを作成
    // Tier1ノードとの接続は曲線、それ以外は直線
    const geometry = this.createGeometry(source, target);

    // マテリアルを作成
    // WebGLの仕様のため線の太さは指定できない
    const material = new THREE.LineBasicMaterial(
      {
        color: lineColor,
        transparent: true, // オブジェクト内部の線を隠すための設定
        depthWrite: false  // オブジェクト内部の線を隠すための設定
      }
    );

    // メッシュ化
    this.line = new THREE.Line(geometry, material);

    // オブジェクト内部の線を隠すための設定
    this.line.renderOrder = 1;

    // 名前を設定しておく
    this.line.name = edge.data.id;

    // redundantIdにあわせてレイヤーを設定
    if (edge.data.hasOwnProperty("redundantId")) {
      if (edge.data.redundantId === 0) {
        this.line.layers.set(LAYERS.REDUNDANT_0);
      } else if (edge.data.redundantId === 1) {
        this.line.layers.set(LAYERS.REDUNDANT_1);
      }
    }

    // 選択可能にする
    this.line.selectable = true;

    // 選択状態
    this.line.selected = false;

    this.add(this.line);
  }


  createGeometry = (source, target) => {
    if (source.data.tier === 1 || target.data.tier === 1) {
      return this.createCurveGeometry(source, target);
    }
    return this.createLineGeometry(source, target);
  }


  createLineGeometry = (source, target) => {
    const vertices = [];

    vertices.push(source.position.x);
    vertices.push(source.position.y);
    vertices.push(source.position.z);

    vertices.push(target.position.x);
    vertices.push(target.position.y);
    vertices.push(target.position.z);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    return geometry;
  }


  createCurveGeometry = (source, target) => {
    const sourcePosition = new THREE.Vector3(source.position.x, source.position.y, source.position.z);
    const targetPosition = new THREE.Vector3(target.position.x, target.position.y, target.position.z);
    const middlePosition = new THREE.Vector3(
      (sourcePosition.x + targetPosition.x) / 2,
      (sourcePosition.y + targetPosition.y) / 2,
      (sourcePosition.z + targetPosition.z) / 2
    );
    middlePosition.multiplyScalar(1.4);

    const bezier = new THREE.QuadraticBezierCurve3(sourcePosition, middlePosition, targetPosition);
    const curvePath = new THREE.CurvePath();
    curvePath.add(bezier);

    const geometry = new THREE.BufferGeometry();

    const points = curvePath.getPoints(12); // Default is 12

    geometry.setFromPoints(points);

    return geometry;
  }


  updateGeometry = () => {
    const geometry = this.createGeometry(this.source, this.target);
    this.line.geometry.dispose();
    this.line.geometry = geometry;
  }

}


export class Diagram {

  // デフォルト動作
  // これらはコンストラクタに渡された引数で上書きされる
  options = {
    graph: [],
    selection: true,
    showLabels: true,
    labelFontSize: "Medium",  // "Small", "Medium", "Large"
    axesHelper: true,
    autoRotate: false,
  };

  // Graphクラスのインスタンス
  graph;

  // ObjectSelectionのインスタンス
  objectSelection;

  // レンダラーのDOMを格納するdiv要素
  container;

  // サイズ
  // 初期化時にDIV要素(container)のサイズに変更する
  sizes = {
    width: 0,
    height: 0
  };

  // シーン、カメラ、レンダラ
  scene;
  camera
  renderer;

  // ラベル表示用のCSS2Dレンダラ
  labelRenderer;

  // XYZ軸表示
  axesHelper;

  // マウス操作コントローラー
  controller;

  // stats.jsを格納するdiv要素とstats.jsのインスタンス
  statsjs;

  // 情報表示用のパラメータ
  infoParams = {
    element: document.getElementById("infoContainer"),
    selected: null
  };

  // ラベル表示用のパラメータ
  labelParams = {
    showLabels: undefined,
    labelFontSize: undefined,
  }

  // グラフ表示用のパラメータ
  graphParams = {
    redundant_0: true,
    redundant_1: true,
    clusters: CLUSTERS_EXAMPLE_1,  // CLUSTERS_EXAMPLE_1, CLUSTERS_EXAMPLE_2, CLUSTERS_EXAMPLE_3,
    layout: "circular",  // "circular", "sphere",
  }

  // OrbitControlのパラメータ
  orbitParams = {
    autoRotate: undefined
  }


  constructor(options = {}) {
    this.options = Object.assign(this.options, options);

    // optionsで渡された値に更新
    this.graph = this.options.graph;

    // 選択可能にするか
    this.selectionEnabled = this.options.selection;

    // ラベル表示の設定
    this.labelParams.showLabels = this.options.showLabels;
    this.labelParams.labelFontSize = this.options.labelFontSize;

    // 軸を表示するか
    this.axesHelperEnabled = this.options.axesHelper;

    // 自動でカメラを回転させるか
    this.orbitParams.autoRotate = this.options.autoRotate;

    this.initThreejs();
    this.initController();
    this.initStatsjs();
    this.initGui();
    this.initObjectSelection();
    this.initEventHandler();

    // Graphクラスの情報を元にシーンにノードとエッジを追加
    this.drawGraph(this.graph);

    this.render();
  }


  initThreejs = () => {

    // コンテナ要素を取得
    this.container = document.getElementById("threejsContainer");

    // コンテナ要素にあわせてサイズを初期化
    this.sizes.width = this.container.clientWidth;
    this.sizes.height = this.container.clientHeight;

    // シーンを初期化
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // カメラを初期化
    this.camera = new THREE.PerspectiveCamera(
      70,                                   // 視野角度 FOV
      this.sizes.width / this.sizes.height, // アスペクト比
      1,                                    // 開始距離
      10000                                 // 終了距離
    );
    this.camera.position.set(200, 200, 600);

    // 利用するレイヤーを有効化
    this.camera.layers.enable(LAYERS.LABEL);       // == 1
    this.camera.layers.enable(LAYERS.REDUNDANT_0); // == 2
    this.camera.layers.enable(LAYERS.REDUNDANT_1); // == 3

    // ラベル表示が初期状態でオフに設定されているなら
    if (this.labelParams.showLabels === false) {
      this.camera.layers.toggle(LAYERS.LABEL);
    }

    // ライトを初期化
    // 環境光
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const light1 = new THREE.DirectionalLight(0xFFFFFF, 1.5);
    light1.position.set(1, 1, 1);
    this.scene.add(light1);

    // const light2 = new THREE.DirectionalLight(0xFFFFFF, 1.5);
    // light2.position.set(-1, -1, 1);
    // this.scene.add(light2);

    // 軸を表示するヘルパーを初期化
    //
    //   Y(green)
    //    |
    //    +---- X(red)
    //   /
    //  Z(blue)
    //
    this.axesHelper = new THREE.AxesHelper(10000);
    this.scene.add(this.axesHelper);
    if (this.axesHelperEnabled === false) {
      this.axesHelper.visible = false;
    }

    // レンダラを初期化
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    // デバイスピクセル比は上限2に制限(3以上のスマホ・タブレットでは処理が重すぎる)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // ラベル用のCSS2Dレンダラを初期化
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(this.sizes.width, this.sizes.height);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0px';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.labelRenderer.domElement);

  }


  // マウス操作のコントロールを初期化
  initController = () => {
    this.controller = new OrbitControls(this.camera, this.renderer.domElement);
    this.controller.enableDamping = true;
    this.controller.autoRotate = this.orbitParams.autoRotate;
    this.controller.autoRotateSpeed = 1.0;
  }


  // stats.jsを初期化
  initStatsjs = () => {
    let container = document.getElementById("statsjsContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "statsjsContainer";
      this.container.appendChild(container);
    }

    this.statsjs = new Stats();
    this.statsjs.dom.style.position = "relative";
    this.statsjs.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    container.appendChild(this.statsjs.dom);
  }


  // lil-guiを初期化
  initGui = () => {
    let container = document.getElementById("guiContainer");

    if (!container) {
      container = document.createElement("div");
      container.id = "guiContainer";
      this.container.appendChild(container);
    }

    const gui = new GUI({
      container: container,
      width: 300,
    });

    // ラベル表示のON/OFFを切り替える
    {
      const folder = gui.addFolder(navigator.language.startsWith("ja") ? "ラベル設定" : "Label");
      folder
        .add(this.labelParams, 'showLabels')
        .name(navigator.language.startsWith("ja") ? "ラベルを表示" : "show node label")
        .onFinishChange(() => {
          // レイヤでラベルを表示するかどうかを切り替える
          this.camera.layers.toggle(LAYERS.LABEL);

          // 表示から非表示に変更したら、render()を呼んで画面から消す
          if (this.camera.layers.test(LAYERS.LABEL) === false) {
            this.labelRenderer.render(this.scene, this.camera);
          }
        });

      folder
        .add(this.labelParams, 'labelFontSize')
        .options(['Small', 'Medium', 'Large'])
        .name(navigator.language.startsWith("ja") ? "フォントサイズ" : "font size")
        .onFinishChange((value) => {
          // CSS2DObjectはDIVを元にしているので、CSSクラスを変更するだけでフォントサイズを変えられる
          document.querySelectorAll('.label').forEach((label) => {
            label.classList.remove('small', 'medium', 'large');
            label.classList.add(value.toLowerCase());
          });
        });
    }

    // axesHelperの表示をON/OFFする
    {
      const folder = gui.addFolder('AxesHelper');
      folder
        .add(this, 'axesHelperEnabled')
        .name(navigator.language.startsWith("ja") ? "軸を表示" : "show AxesHelper")
        .onFinishChange((value) => {
          this.axesHelper.visible = value;
        });
    }

    // OrbitControlsの自動回転のON/OFFを変更する
    {
      const folder = gui.addFolder('OrbitControls');
      folder
        .add(this.orbitParams, 'autoRotate')
        .name(navigator.language.startsWith("ja") ? "回転" : "auto rotate")
        .onFinishChange((value) => {
          this.controller.autoRotate = value;
          if (value) {
            // 回転中はマウス操作を無効にする
            this.selectionEnabled = false;
          }
        });
    }

    // selectionEnabledのON/OFFを変更する
    {
      const folder = gui.addFolder('ObjectSelection');
      folder
        .add(this, 'selectionEnabled')
        .name(navigator.language.startsWith("ja") ? "マウスで選択" : "selectionEnabled")
        .listen();
    }

    // グラフのredundantIdの表示ON/OFFを切り替える
    {
      const folder = gui.addFolder(navigator.language.startsWith("ja") ? "冗長系" : "Redundant");
      folder
        .add(this.graphParams, 'redundant_0')
        .name(navigator.language.startsWith("ja") ? "0系を表示" : "show redundant 0")
        .onFinishChange(() => {
          this.camera.layers.toggle(LAYERS.REDUNDANT_0);
        });
      folder
        .add(this.graphParams, 'redundant_1')
        .name(navigator.language.startsWith("ja") ? "1系を表示" : "show redundant 1")
        .onFinishChange(() => {
          this.camera.layers.toggle(LAYERS.REDUNDANT_1);
        });
    }
  }


  // ObjectSelectionを初期化
  initObjectSelection = () => {

    this.objectSelection = new ObjectSelection({
      domElement: this.renderer.domElement,
      // レイヤ1はラベル用なので除外する
      layers: [LAYERS.REDUNDANT_0, LAYERS.REDUNDANT_1],
      mouseover: (obj) => {
        if (obj === null) {
          // フォーカスが外れるとnullが渡される
          this.infoParams.selected = null;
          this.infoParams.element.innerHTML = "";
        } else {
          // フォーカスが当たるとオブジェクトが渡される
          if (!obj.name) {
            // グラフの要素は全て名前を設定している
            return;
          }
          console.log(obj.name);
          const element = this.graph.getElementById(obj.name);
          if (!element) {
            return;
          }
          this.infoParams.selected = element.data.id;
          this.infoParams.element.innerHTML = `Mouseover: ${this.infoParams.selected}`;
        }
      },

      click: (obj) => {
        if (!obj) {
          return;
        }
        if (!obj.name) {
          return;
        }

        // クリックされたオブジェクトの名前から、グラフのエレメント（Node or Edge)を取得する
        const element = this.graph.getElementById(obj.name);

        // クリックされているのはノードの球なので、親になっているグループを取得する
        const parent = obj.parent;

        // ノードの場合
        //  - 選択状態を設定
        //  - 強調表示のコーンを表示/非表示する
        //  - ブリンクエフェクトを開始/終了する
        if (parent && parent.constructor.name === "Node") {
          // 選択状態を設定
          parent.isSelected = !parent.isSelected;

          // コーンを表示/非表示
          const cone = parent.getObjectByName(`${element.data.id}_cone`);
          if (cone) {
            cone.visible = parent.isSelected;
          }

          // ブリンクエフェクト
          parent.blinkEffect();
        }

        /*
        // スクリーン座標を求めてコンソールに表示する
        const worldPosition = obj.getWorldPosition(new THREE.Vector3());
        const projection = worldPosition.project(this.camera);
        const screenX = Math.round((projection.x + 1) / 2 * this.sizes.width);
        const screenY = Math.round(-(projection.y - 1) / 2 * this.sizes.height);
        console.log(`${element.data.id} (${screenX}, ${screenY})`);
        */

      }
    });

  }

  // イベントハンドラを登録
  initEventHandler = () => {
    // テスト用
    // ボタンを押したらシーン上のグラフを全て削除
    {
      const tag = document.getElementById("idButton1");
      if (tag) {
        tag.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.removeGraph();
        });
      }
    }

    // クリックでデータを切り替え
    {
      ['idData1', 'idData2', 'idData3'].forEach((id) => {
        const tag = document.getElementById(id);
        if (tag) {
          tag.addEventListener('click', (evt) => {
            evt.stopPropagation();
            evt.preventDefault();
            document.getElementsByName('dataChangeMenu').forEach((element) => {
              element.classList.remove('active');
            });
            evt.target.classList.add('active');

            // クリックしたメニューに応じてgraphParams.clustersを変更する
            switch (id) {
              case 'idData1':
                this.graphParams.clusters = CLUSTERS_EXAMPLE_1;
                break;
              case 'idData2':
                this.graphParams.clusters = CLUSTERS_EXAMPLE_2;
                break;
              case 'idData3':
                this.graphParams.clusters = CLUSTERS_EXAMPLE_3;
                break;
            }

            // シーン上のオブジェクトを全て削除して、
            this.removeGraph();

            // 新たにサンプル用のグラフを作成する
            this.graph = createSampleGraph({
              clusters: this.graphParams.clusters,
              layout: this.graphParams.layout,
            });

            // シーン上に追加
            this.drawGraph(this.graph);
          });
        }
      });
    }

    // クリックでレイアウト変更
    {
      ['idLayout1', 'idLayout2', 'idLayout3'].forEach((id) => {
        const tag = document.getElementById(id);
        if (tag) {
          tag.addEventListener('click', (evt) => {
            evt.stopPropagation();
            evt.preventDefault();
            document.getElementsByName('layoutChangeMenu').forEach((element) => {
              element.classList.remove('active');
            });
            evt.target.classList.add('active');

            switch (id) {
              case 'idLayout1':
                this.graphParams.layout = "circular";
                break;
              case 'idLayout2':
                this.graphParams.layout = "sphere";
                break;
              case 'idLayout3':
                this.graphParams.layout = "grid";
                break;
            }

            this.graph.getNodes().forEach((node) => {
              // Graphのnodeデータの位置情報を指定されたレイアウトにあわせて更新する
              node.position.x = node.data.positions[this.graphParams.layout].x;
              node.position.y = node.data.positions[this.graphParams.layout].y;
              node.position.z = node.data.positions[this.graphParams.layout].z;

              // シーン上のNodeクラスオブジェクトの位置を更新する
              let nodeGroup = this.scene.getObjectByName(`${node.data.id}_group`);
              if (nodeGroup) {
                nodeGroup.updatePosition();
              }
            });

            this.graph.getEdges().forEach((edge) => {
              // シーン上のEdgeクラスオブジェクトの位置を更新する
              let edgeGroup = this.scene.getObjectByName(`${edge.data.id}_group`);
              if (edgeGroup) {
                edgeGroup.updateGeometry();
              }
            });

          });
        }
      });
    }

    // ブラウザのリサイズイベントを登録
    window.addEventListener("resize", () => {
      // コンテナ要素のサイズに合わせてsizesを更新する
      this.sizes.width = this.container.clientWidth;
      this.sizes.height = this.container.clientHeight;

      this.camera.aspect = this.sizes.width / this.sizes.height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(this.sizes.width, this.sizes.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // labelRendererはCSS2DレンダラなのでsetPixelRatio()は存在しない
      this.labelRenderer.setSize(this.sizes.width, this.sizes.height);
    }, false);

  }

  render = () => {
    // 再帰処理
    requestAnimationFrame(this.render);

    // stats.jsを更新
    this.statsjs.update();

    // マウス制御のコントローラを更新
    this.controller.update();

    // render scene
    this.renderer.render(this.scene, this.camera);

    // render label
    if (this.labelParams.showLabels) {
      this.labelRenderer.render(this.scene, this.camera);
    }

    // render ObjectSelection
    if (this.selectionEnabled) {
      this.objectSelection.render(this.scene, this.camera);
    }

  }


  //
  // Graphクラスのインスタンスの情報をもとにノードとエッジをシーン上に作成する
  //
  drawGraph = () => {

    // ノードを作成
    this.graph.getNodes().forEach((node) => {
      const n = new Node(node);
      this.scene.add(n);
    });

    // エッジを作成
    this.graph.getEdges().forEach((edge) => {
      const sourceNodeId = edge.data.source;
      const sourceNode = this.graph.getElementById(sourceNodeId);

      const targetNodeId = edge.data.target;
      const targetNode = this.graph.getElementById(targetNodeId);

      if (sourceNode && targetNode) {
        const e = new Edge(edge, sourceNode, targetNode);
        this.scene.add(e);
      }
    });
  }

  //
  // シーン上のノードとエッジを削除する
  //
  removeGraph = () => {

    // シーン上のNodeオブジェクトを削除する
    this.graph.getNodes().forEach((node) => {

      let nodeGroup = this.scene.getObjectByName(`${node.data.id}_group`);
      if (nodeGroup) {
        while (nodeGroup.children.length) {
          // ラベルを含む全ての子オブジェクトを削除
          const obj = nodeGroup.children[0];
          // console.log(`remove ${obj.name}`);
          obj.parent.remove(obj);
        }
        this.scene.remove(nodeGroup);
      }
    });

    // シーン上のEdgeオブジェクトを取得して削除
    this.graph.getEdges().forEach((edge) => {

      let edgeGroup = this.scene.getObjectByName(`${edge.data.id}_group`);
      if (edgeGroup) {
        while (edgeGroup.children.length) {
          const obj = edgeGroup.children[0];
          // console.log(`remove ${obj.name}`);
          obj.parent.remove(obj);
        }
        this.scene.remove(edgeGroup);
      }
    });

    // シーンに残っているオブジェクトを表示する
    // console.log(this.scene.children);
  }


}