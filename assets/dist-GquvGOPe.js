import{Ao as me,Es as N,Fo as gt,Fs as dt,Io as oe,Ls as ht,Ro as ve,Ss as pt,ao as ft,cs as mt,es as U,hs as ie,io as vt,ko as xe,ks as ye,ls as G,os as xt,so as be,ss as yt,us as bt,zs as j}from"./maplibre-Ds_VLScx.js";var Ct="transform_output",Ce=class{device;model;sampler;currentIndex=0;samplerTextureMap=null;bindings=[];resources={};constructor(e,t){this.device=e,this.sampler=e.createSampler({addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",minFilter:"nearest",magFilter:"nearest",mipmapFilter:"nearest"}),this.model=new G(this.device,{id:t.id||bt("texture-transform-model"),fs:t.fs||ht({input:t.targetTextureVarying,inputChannels:t.targetTextureChannels,output:Ct}),vertexCount:t.vertexCount,...t}),this._initialize(t),Object.seal(this)}destroy(){this.model.destroy();for(const e of this.bindings)e.framebuffer?.destroy()}delete(){this.destroy()}run(e){const{framebuffer:t}=this.bindings[this.currentIndex],o=this.device.beginRenderPass({framebuffer:t,...e});this.model.draw(o),o.end(),this.device.submit()}getTargetTexture(){const{targetTexture:e}=this.bindings[this.currentIndex];return e}getFramebuffer(){return this.bindings[this.currentIndex].framebuffer}_initialize(e){this._updateBindings(e)}_updateBindings(e){this.bindings[this.currentIndex]=this._updateBinding(this.bindings[this.currentIndex],e)}_updateBinding(e,{sourceBuffers:t,sourceTextures:o,targetTexture:i}){if(e||(e={sourceBuffers:{},sourceTextures:{},targetTexture:null}),Object.assign(e.sourceTextures,o),Object.assign(e.sourceBuffers,t),i){e.targetTexture=i;const{width:n,height:s}=i;e.framebuffer&&e.framebuffer.destroy(),e.framebuffer=this.device.createFramebuffer({id:"transform-framebuffer",width:n,height:s,colorAttachments:[i]}),e.framebuffer.resize({width:n,height:s})}return e}_setSourceTextureParameters(){const e=this.currentIndex,{sourceTextures:t}=this.bindings[e];for(const o in t)t[o].sampler=this.sampler}};function St({pointCount:e,getBinId:t}){const o=new Map;for(let i=0;i<e;i++){const n=t(i);if(n===null)continue;let s=o.get(String(n));s?s.points.push(i):(s={id:n,index:o.size,points:[i]},o.set(String(n),s))}return Array.from(o.values())}function Tt({bins:e,dimensions:t,target:o}){const i=e.length*t;(!o||o.length<i)&&(o=new Float32Array(i));for(let n=0;n<e.length;n++){const{id:s}=e[n];Array.isArray(s)?o.set(s,n*t):o[n]=s}return o}var _t=e=>e.length,Se=(e,t)=>{let o=0;for(const i of e)o+=t(i);return o},At=(e,t)=>e.length===0?NaN:Se(e,t)/e.length,Pt=(e,t)=>{let o=1/0;for(const i of e){const n=t(i);n<o&&(o=n)}return o},Nt=(e,t)=>{let o=-1/0;for(const i of e){const n=t(i);n>o&&(o=n)}return o},wt={COUNT:_t,SUM:Se,MEAN:At,MIN:Pt,MAX:Nt};function Et({bins:e,getValue:t,operation:o,target:i}){(!i||i.length<e.length)&&(i=new Float32Array(e.length));let n=1/0,s=-1/0;for(let r=0;r<e.length;r++){const{points:l}=e[r];i[r]=o(l,t),i[r]<n&&(n=i[r]),i[r]>s&&(s=i[r])}return{value:i,domain:[n,s]}}function Te(e,t,o){const i={};for(const s of e.sources||[]){const r=t[s];if(r)i[s]=Mt(r);else throw new Error(`Cannot find attribute ${s}`)}const n={};return s=>{for(const r in i)n[r]=i[r](s);return e.getValue(n,s,o)}}function Mt(e){const t=e.value,{offset:o=0,stride:i,size:n}=e.getAccessor(),s=t.BYTES_PER_ELEMENT,r=o/s,l=i?i/s:n;if(n===1)return e.isConstant?()=>t[0]:u=>{const d=r+l*u;return t[d]};let c;return e.isConstant?(c=Array.from(t),()=>c):(c=new Array(n),u=>{const d=r+l*u;for(let h=0;h<n;h++)c[h]=t[d+h];return c})}var w=class{constructor(e){this.bins=[],this.binIds=null,this.results=[],this.dimensions=e.dimensions,this.channelCount=e.getValue.length,this.props={...e,binOptions:{},pointCount:0,operations:[],customOperations:[],attributes:{}},this.needsUpdate=!0,this.setProps(e)}destroy(){}get binCount(){return this.bins.length}setProps(e){const t=this.props;if(e.binOptions&&(U(e.binOptions,t.binOptions,2)||this.setNeedsUpdate()),e.operations)for(let o=0;o<this.channelCount;o++)e.operations[o]!==t.operations[o]&&this.setNeedsUpdate(o);if(e.customOperations)for(let o=0;o<this.channelCount;o++)!!e.customOperations[o]!=!!t.customOperations[o]&&this.setNeedsUpdate(o);e.pointCount!==void 0&&e.pointCount!==t.pointCount&&this.setNeedsUpdate(),e.attributes&&(e.attributes={...t.attributes,...e.attributes}),Object.assign(this.props,e)}setNeedsUpdate(e){e===void 0?this.needsUpdate=!0:this.needsUpdate!==!0&&(this.needsUpdate=this.needsUpdate||[],this.needsUpdate[e]=!0)}update(){if(this.needsUpdate===!0){this.bins=St({pointCount:this.props.pointCount,getBinId:Te(this.props.getBin,this.props.attributes,this.props.binOptions)});const e=Tt({bins:this.bins,dimensions:this.dimensions,target:this.binIds?.value});this.binIds={value:e,type:"float32",size:this.dimensions}}for(let e=0;e<this.channelCount;e++)if(this.needsUpdate===!0||this.needsUpdate[e]){const t=this.props.customOperations[e]||wt[this.props.operations[e]],{value:o,domain:i}=Et({bins:this.bins,getValue:Te(this.props.getValue[e],this.props.attributes,void 0),operation:t,target:this.results[e]?.value});this.results[e]={value:o,domain:i,type:"float32",size:1},this.props.onUpdate?.({channel:e})}this.needsUpdate=!1}preDraw(){}getBins(){return this.binIds}getResult(e){return this.results[e]}getResultDomain(e){return this.results[e]?.domain??[1/0,-1/0]}getBin(e){const t=this.bins[e];if(!t)return null;const o=new Array(this.channelCount);for(let i=0;i<o.length;i++){const n=this.results[i];o[i]=n?.value[e]}return{id:t.id,value:o,count:t.points.length,pointIndices:t.points}}};function _e(e,t,o){return e.createFramebuffer({width:t,height:o,colorAttachments:[e.createTexture({width:t,height:o,format:"rgba32float",sampler:{minFilter:"nearest",magFilter:"nearest"}})]})}var It={name:"binSorter",vs:`layout(std140) uniform binSorterUniforms {
  ivec4 binIdRange;
  ivec2 targetSize;
} binSorter;
`,uniformTypes:{binIdRange:"vec4<i32>",targetSize:"vec2<i32>"}},Ae=[1,2,4,8],Ot=3e38,Lt={SUM:0,MEAN:0,MIN:0,MAX:0,COUNT:0},H=1024,Dt=class{constructor(e,t){this.binsFBO=null,this.device=e,this.model=Rt(e,t)}get texture(){return this.binsFBO?this.binsFBO.colorAttachments[0].texture:null}destroy(){this.model.destroy(),this.binsFBO?.colorAttachments[0].texture.destroy(),this.binsFBO?.destroy()}getBinValues(e){if(!this.binsFBO)return null;const t=e%H,o=Math.floor(e/H),i=this.device.readPixelsToArrayWebGL(this.binsFBO,{sourceX:t,sourceY:o,sourceWidth:1,sourceHeight:1}).buffer;return new Float32Array(i)}setDimensions(e,t){const o=H,i=Math.ceil(e/o);this.binsFBO?this.binsFBO.height<i&&this.binsFBO.resize({width:o,height:i}):this.binsFBO=_e(this.device,o,i);const n={binIdRange:[t[0][0],t[0][1],t[1]?.[0]||0,t[1]?.[1]||0],targetSize:[this.binsFBO.width,this.binsFBO.height]};this.model.shaderInputs.setProps({binSorter:n})}setModelProps(e){const t=this.model;e.attributes&&t.setAttributes(e.attributes),e.constantAttributes&&t.setConstantAttributes(e.constantAttributes),e.vertexCount!==void 0&&t.setVertexCount(e.vertexCount),e.shaderModuleProps&&t.shaderInputs.setProps(e.shaderModuleProps)}update(e){if(!this.binsFBO)return;const t=Wt(e);this._updateBins("SUM",t.SUM+t.MEAN),this._updateBins("MIN",t.MIN),this._updateBins("MAX",t.MAX)}_updateBins(e,t){if(t===0)return;t|=Ae[3];const o=this.model,i=this.binsFBO,n=e==="MAX"?-3e38:e==="MIN"?Ot:0,s=this.device.beginRenderPass({id:`gpu-aggregation-${e}`,framebuffer:i,parameters:{viewport:[0,0,i.width,i.height],colorMask:t},clearColor:[n,n,n,0],clearDepth:!1,clearStencil:!1});o.setParameters({blend:!0,blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one",blendColorOperation:e==="MAX"?"max":e==="MIN"?"min":"add",blendAlphaOperation:"add"}),o.draw(s),s.end()}};function Wt(e){const t={...Lt};for(let o=0;o<e.length;o++){const i=e[o];i&&(t[i]+=Ae[o])}return t}function Rt(e,t){let o=t.vs;t.dimensions===2&&(o+=`
void getBin(out int binId) {
  ivec2 binId2;
  getBin(binId2);
  if (binId2.x < binSorter.binIdRange.x || binId2.x >= binSorter.binIdRange.y) {
    binId = -1;
  } else {
    binId = (binId2.y - binSorter.binIdRange.z) * (binSorter.binIdRange.y - binSorter.binIdRange.x) + binId2.x;
  }
}
`);const i=`#version 300 es
#define SHADER_NAME gpu-aggregation-sort-bins-vertex

${o}

out vec3 v_Value;

void main() {
  int binIndex;
  getBin(binIndex);
  binIndex = binIndex - binSorter.binIdRange.x;
  if (binIndex < 0) {
    gl_Position = vec4(0.);
    return;
  }
  int row = binIndex / binSorter.targetSize.x;
  int col = binIndex - row * binSorter.targetSize.x;
  vec2 position = (vec2(col, row) + 0.5) / vec2(binSorter.targetSize) * 2.0 - 1.0;
  gl_Position = vec4(position, 0.0, 1.0);
  gl_PointSize = 1.0;

#if NUM_CHANNELS == 3
  getValue(v_Value);
#elif NUM_CHANNELS == 2
  getValue(v_Value.xy);
#else
  getValue(v_Value.x);
#endif
}
`,n=`#version 300 es
#define SHADER_NAME gpu-aggregation-sort-bins-fragment

precision highp float;

in vec3 v_Value;
out vec4 fragColor;

void main() {
  fragColor.xyz = v_Value;

  #ifdef MODULE_GEOMETRY
  geometry.uv = vec2(0.);
  DECKGL_FILTER_COLOR(fragColor, geometry);
  #endif

  fragColor.w = 1.0;
}
`;return new G(e,{bufferLayout:t.bufferLayout,modules:[...t.modules||[],It],defines:{...t.defines,NON_INSTANCED_MODEL:1,NUM_CHANNELS:t.channelCount},isInstanced:!1,vs:i,fs:n,topology:"point-list",disableWarnings:!0})}var zt={name:"aggregatorTransform",vs:`layout(std140) uniform aggregatorTransformUniforms {
  ivec4 binIdRange;
  bvec3 isCount;
  bvec3 isMean;
  float naN;
} aggregatorTransform;
`,uniformTypes:{binIdRange:"vec4<i32>",isCount:"vec3<f32>",isMean:"vec3<f32>",naN:"f32"}},Bt=class{constructor(e,t){this.binBuffer=null,this.valueBuffer=null,this._domains=null,this.device=e,this.channelCount=t.channelCount,this.transform=Vt(e,t),this.domainFBO=_e(e,2,1)}destroy(){this.transform.destroy(),this.binBuffer?.destroy(),this.valueBuffer?.destroy(),this.domainFBO.colorAttachments[0].texture.destroy(),this.domainFBO.destroy()}get domains(){if(!this._domains){const e=this.device.readPixelsToArrayWebGL(this.domainFBO).buffer,t=new Float32Array(e);this._domains=[[-t[4],t[0]],[-t[5],t[1]],[-t[6],t[2]]].slice(0,this.channelCount)}return this._domains}setDimensions(e,t){const{model:o,transformFeedback:i}=this.transform;o.setVertexCount(e);const n={binIdRange:[t[0][0],t[0][1],t[1]?.[0]||0,t[1]?.[1]||0]};o.shaderInputs.setProps({aggregatorTransform:n});const s=e*t.length*4;(!this.binBuffer||this.binBuffer.byteLength<s)&&(this.binBuffer?.destroy(),this.binBuffer=this.device.createBuffer({byteLength:s}),i.setBuffer("binIds",this.binBuffer));const r=e*this.channelCount*4;(!this.valueBuffer||this.valueBuffer.byteLength<r)&&(this.valueBuffer?.destroy(),this.valueBuffer=this.device.createBuffer({byteLength:r}),i.setBuffer("values",this.valueBuffer))}update(e,t){if(!e)return;const o=this.transform,i=this.domainFBO,n={isCount:[0,1,2].map(s=>t[s]==="COUNT"?1:0),isMean:[0,1,2].map(s=>t[s]==="MEAN"?1:0),bins:e};o.model.shaderInputs.setProps({aggregatorTransform:n}),o.run({id:"gpu-aggregation-domain",framebuffer:i,parameters:{viewport:[0,0,2,1]},clearColor:[-3e38,-3e38,-3e38,0],clearDepth:!1,clearStencil:!1}),this._domains=null}};function Vt(e,t){const o=`#version 300 es
#define SHADER_NAME gpu-aggregation-domain-vertex

uniform sampler2D bins;

#if NUM_DIMS == 1
out float binIds;
#else
out vec2 binIds;
#endif

#if NUM_CHANNELS == 1
flat out float values;
#elif NUM_CHANNELS == 2
flat out vec2 values;
#else
flat out vec3 values;
#endif

const float NAN = intBitsToFloat(-1);

void main() {
  int row = gl_VertexID / SAMPLER_WIDTH;
  int col = gl_VertexID - row * SAMPLER_WIDTH;
  vec4 weights = texelFetch(bins, ivec2(col, row), 0);
  vec3 value3 = mix(
    mix(weights.rgb, vec3(weights.a), aggregatorTransform.isCount),
    weights.rgb / max(weights.a, 1.0),
    aggregatorTransform.isMean
  );
  if (weights.a == 0.0) {
    value3 = vec3(NAN);
  }

#if NUM_DIMS == 1
  binIds = float(gl_VertexID + aggregatorTransform.binIdRange.x);
#else
  int y = gl_VertexID / (aggregatorTransform.binIdRange.y - aggregatorTransform.binIdRange.x);
  int x = gl_VertexID - y * (aggregatorTransform.binIdRange.y - aggregatorTransform.binIdRange.x);
  binIds.y = float(y + aggregatorTransform.binIdRange.z);
  binIds.x = float(x + aggregatorTransform.binIdRange.x);
#endif

#if NUM_CHANNELS == 3
  values = value3;
#elif NUM_CHANNELS == 2
  values = value3.xy;
#else
  values = value3.x;
#endif

  gl_Position = vec4(0., 0., 0., 1.);
  // This model renders into a 2x1 texture to obtain min and max simultaneously.
  // See comments in fragment shader
  gl_PointSize = 2.0;
}
`,i=`#version 300 es
#define SHADER_NAME gpu-aggregation-domain-fragment

precision highp float;

#if NUM_CHANNELS == 1
flat in float values;
#elif NUM_CHANNELS == 2
flat in vec2 values;
#else
flat in vec3 values;
#endif

out vec4 fragColor;

void main() {
  vec3 value3;
#if NUM_CHANNELS == 3
  value3 = values;
#elif NUM_CHANNELS == 2
  value3.xy = values;
#else
  value3.x = values;
#endif
  if (isnan(value3.x)) discard;
  // This shader renders into a 2x1 texture with blending=max
  // The left pixel yields the max value of each channel
  // The right pixel yields the min value of each channel
  if (gl_FragCoord.x < 1.0) {
    fragColor = vec4(value3, 1.0);
  } else {
    fragColor = vec4(-value3, 1.0);
  }
}
`;return e.type==="webgl"&&e.getExtension("GL_ARB_shader_bit_encoding"),new mt(e,{vs:o,fs:i,topology:"point-list",modules:[zt],parameters:{blend:!0,blendColorSrcFactor:"one",blendColorDstFactor:"one",blendColorOperation:"max",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one",blendAlphaOperation:"max"},defines:{NUM_DIMS:t.dimensions,NUM_CHANNELS:t.channelCount,SAMPLER_WIDTH:H},varyings:["binIds","values"],disableWarnings:!0})}var T=class{static isSupported(e){return e.features.has("float32-renderable-webgl")&&e.features.has("texture-blend-float-webgl")}constructor(e,t){this.binCount=0,this.binIds=null,this.results=[],this.device=e,this.dimensions=t.dimensions,this.channelCount=t.channelCount,this.props={...t,pointCount:0,binIdRange:[[0,0]],operations:[],attributes:{},binOptions:{}},this.needsUpdate=new Array(this.channelCount).fill(!0),this.binSorter=new Dt(e,t),this.aggregationTransform=new Bt(e,t),this.setProps(t)}getBins(){const e=this.aggregationTransform.binBuffer;return e?(this.binIds?.buffer!==e&&(this.binIds={buffer:e,type:"float32",size:this.dimensions}),this.binIds):null}getResult(e){const t=this.aggregationTransform.valueBuffer;return!t||e>=this.channelCount?null:(this.results[e]?.buffer!==t&&(this.results[e]={buffer:t,type:"float32",size:1,stride:this.channelCount*4,offset:e*4}),this.results[e])}getResultDomain(e){return this.aggregationTransform.domains[e]}getBin(e){if(e<0||e>=this.binCount)return null;const{binIdRange:t}=this.props;let o;if(this.dimensions===1)o=[e+t[0][0]];else{const[[r,l],[c]]=t,u=l-r;o=[e%u+r,Math.floor(e/u)+c]}const i=this.binSorter.getBinValues(e);if(!i)return null;const n=i[3],s=[];for(let r=0;r<this.channelCount;r++){const l=this.props.operations[r];l==="COUNT"?s[r]=n:n===0?s[r]=NaN:s[r]=l==="MEAN"?i[r]/n:i[r]}return{id:o,value:s,count:n}}destroy(){this.binSorter.destroy(),this.aggregationTransform.destroy()}setProps(e){const t=this.props;if("binIdRange"in e&&!U(e.binIdRange,t.binIdRange,2)){const o=e.binIdRange;if(j.assert(o.length===this.dimensions),this.dimensions===1){const[[i,n]]=o;this.binCount=n-i}else{const[[i,n],[s,r]]=o;this.binCount=(n-i)*(r-s)}this.binSorter.setDimensions(this.binCount,o),this.aggregationTransform.setDimensions(this.binCount,o),this.setNeedsUpdate()}if(e.operations)for(let o=0;o<this.channelCount;o++)e.operations[o]!==t.operations[o]&&this.setNeedsUpdate(o);if(e.pointCount!==void 0&&e.pointCount!==t.pointCount&&(this.binSorter.setModelProps({vertexCount:e.pointCount}),this.setNeedsUpdate()),e.binOptions&&(U(e.binOptions,t.binOptions,2)||this.setNeedsUpdate(),this.binSorter.model.shaderInputs.setProps({binOptions:e.binOptions})),e.attributes){const o={},i={};for(const n of Object.values(e.attributes))for(const[s,r]of Object.entries(n.getValue()))ArrayBuffer.isView(r)?i[s]=r:r&&(o[s]=r);this.binSorter.setModelProps({attributes:o,constantAttributes:i})}e.shaderModuleProps&&this.binSorter.setModelProps({shaderModuleProps:e.shaderModuleProps}),Object.assign(this.props,e)}setNeedsUpdate(e){e===void 0?this.needsUpdate.fill(!0):this.needsUpdate[e]=!0}update(){}preDraw(){if(!this.needsUpdate.some(Boolean))return;const{operations:e}=this.props,t=this.needsUpdate.map((o,i)=>o?e[i]:null);this.binSorter.update(t),this.aggregationTransform.update(this.binSorter.texture,e);for(let o=0;o<this.channelCount;o++)this.needsUpdate[o]&&(this.needsUpdate[o]=!1,this.props.onUpdate?.({channel:o}))}},E=class extends xe{get isDrawable(){return!0}initializeState(){this.getAttributeManager().remove(["instancePickingColors"])}updateState(e){super.updateState(e);const t=this.getAggregatorType();if(e.changeFlags.extensionsChanged||this.state.aggregatorType!==t){this.state.aggregator?.destroy();const o=this.createAggregator(t);return o.setProps({attributes:this.getAttributeManager()?.attributes}),this.setState({aggregator:o,aggregatorType:t}),!0}return!1}finalizeState(e){super.finalizeState(e),this.state.aggregator.destroy()}updateAttributes(e){const{aggregator:t}=this.state;t.setProps({attributes:e});for(const o in e)this.onAttributeChange(o);t.update()}draw({shaderModuleProps:e}){const{aggregator:t}=this.state;t.setProps({shaderModuleProps:e}),t.preDraw()}_getAttributeManager(){return new oe(this.context.device,{id:this.props.id,stats:this.context.stats})}};E.layerName="AggregationLayer";var k=[[255,255,178],[254,217,118],[254,178,76],[253,141,60],[240,59,32],[189,0,38]];function Pe(e,t=!1,o=Float32Array){let i;if(Number.isFinite(e[0]))i=new o(e);else{i=new o(e.length*4);let n=0;for(let s=0;s<e.length;s++){const r=e[s];i[n++]=r[0],i[n++]=r[1],i[n++]=r[2],i[n++]=Number.isFinite(r[3])?r[3]:255}}if(t)for(let n=0;n<i.length;n++)i[n]/=255;return i}var X={linear:"linear",quantile:"nearest",quantize:"nearest",ordinal:"nearest"};function ne(e,t){e.setSampler({minFilter:X[t],magFilter:X[t]})}function se(e,t,o="linear"){const i=Pe(t,!1,Uint8Array);return e.createTexture({format:"rgba8unorm",sampler:{minFilter:X[o],magFilter:X[o],addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"},data:i,width:i.length/4,height:1})}var Ut=`#version 300 es
#define SHADER_NAME screen-grid-layer-vertex-shader
#define RANGE_COUNT 6
in vec2 positions;
in vec2 instancePositions;
in float instanceWeights;
in vec3 instancePickingColors;
uniform sampler2D colorRange;
out vec4 vColor;
vec4 interp(float value, vec2 domain, sampler2D range) {
float r = (value - domain.x) / (domain.y - domain.x);
return texture(range, vec2(r, 0.5));
}
void main(void) {
if (isnan(instanceWeights)) {
gl_Position = vec4(0.);
return;
}
vec2 pos = instancePositions * screenGrid.gridSizeClipspace + positions * screenGrid.cellSizeClipspace;
pos.x = pos.x - 1.0;
pos.y = 1.0 - pos.y;
gl_Position = vec4(pos, 0., 1.);
vColor = interp(instanceWeights, screenGrid.colorDomain, colorRange);
vColor.a *= layer.opacity;
picking_setPickingColor(instancePickingColors);
}
`,Ft=`#version 300 es
#define SHADER_NAME screen-grid-layer-fragment-shader
precision highp float;
in vec4 vColor;
out vec4 fragColor;
void main(void) {
fragColor = vColor;
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,Gt={name:"screenGrid",vs:`layout(std140) uniform screenGridUniforms {
  vec2 cellSizeClipspace;
  vec2 gridSizeClipspace;
  vec2 colorDomain;
} screenGrid;
`,uniformTypes:{cellSizeClipspace:"vec2<f32>",gridSizeClipspace:"vec2<f32>",colorDomain:"vec2<f32>"}},Ne=class extends me{getShaders(){return super.getShaders({vs:Ut,fs:Ft,modules:[pt,Gt]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:2,type:"float32",accessor:"getBin"},instanceWeights:{size:1,type:"float32",accessor:"getWeight"}}),this.state.model=this._getModel()}updateState(e){super.updateState(e);const{props:t,oldProps:o,changeFlags:i}=e,n=this.state.model;if(o.colorRange!==t.colorRange){this.state.colorTexture?.destroy(),this.state.colorTexture=se(this.context.device,t.colorRange,t.colorScaleType);const s={colorRange:this.state.colorTexture};n.shaderInputs.setProps({screenGrid:s})}else o.colorScaleType!==t.colorScaleType&&ne(this.state.colorTexture,t.colorScaleType);if(o.cellMarginPixels!==t.cellMarginPixels||o.cellSizePixels!==t.cellSizePixels||i.viewportChanged){const{width:s,height:r}=this.context.viewport,{cellSizePixels:l,cellMarginPixels:c}=this.props,u=Math.max(l-c,0),d={gridSizeClipspace:[l/s*2,l/r*2],cellSizeClipspace:[u/s*2,u/r*2]};n.shaderInputs.setProps({screenGrid:d})}}finalizeState(e){super.finalizeState(e),this.state.colorTexture?.destroy()}draw({uniforms:e}){const t=this.props.colorDomain(),o=this.state.model,i={colorDomain:t};o.shaderInputs.setProps({screenGrid:i}),o.draw(this.context.renderPass)}_getModel(){return new G(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new yt({topology:"triangle-strip",attributes:{positions:{value:new Float32Array([0,0,1,0,0,1,1,1]),size:2}}}),isInstanced:!0})}};Ne.layerName="ScreenGridCellLayer";var jt={name:"binOptions",vs:`layout(std140) uniform binOptionsUniforms {
  float cellSizePixels;
} binOptions;
`,uniformTypes:{cellSizePixels:"f32"}},Ht={cellSizePixels:{type:"number",value:100,min:1},cellMarginPixels:{type:"number",value:2,min:0},colorRange:k,colorScaleType:"linear",getPosition:{type:"accessor",value:e=>e.position},getWeight:{type:"accessor",value:1},gpuAggregation:!0,aggregation:"SUM"},re=class extends E{getAggregatorType(){return this.props.gpuAggregation&&T.isSupported(this.context.device)?"gpu":"cpu"}createAggregator(e){return e==="cpu"||!T.isSupported(this.context.device)?new w({dimensions:2,getBin:{sources:["positions"],getValue:({positions:t},o,i)=>{const n=this.context.viewport,s=n.project(t),r=i.cellSizePixels;return s[0]<0||s[0]>=n.width||s[1]<0||s[1]>=n.height?null:[Math.floor(s[0]/r),Math.floor(s[1]/r)]}},getValue:[{sources:["counts"],getValue:({counts:t})=>t}]}):new T(this.context.device,{dimensions:2,channelCount:1,bufferLayout:this.getAttributeManager().getBufferLayouts({isInstanced:!1}),...super.getShaders({modules:[N,jt],vs:`
  in vec3 positions;
  in vec3 positions64Low;
  in float counts;
  
  void getBin(out ivec2 binId) {
    vec4 pos = project_position_to_clipspace(positions, positions64Low, vec3(0.0));
    vec2 screenCoords = vec2(pos.x / pos.w + 1.0, 1.0 - pos.y / pos.w) / 2.0 * project.viewportSize.xy / project.devicePixelRatio;
    vec2 gridCoords = floor(screenCoords / binOptions.cellSizePixels);
    binId = ivec2(gridCoords);
  }
  void getValue(out float weight) {
    weight = counts;
  }
  `})})}initializeState(){super.initializeState(),this.getAttributeManager().add({positions:{size:3,accessor:"getPosition",type:"float64",fp64:this.use64bitPositions()},counts:{size:1,accessor:"getWeight"}})}shouldUpdateState({changeFlags:e}){return e.somethingChanged}updateState(e){const t=super.updateState(e),{props:o,oldProps:i,changeFlags:n}=e,{cellSizePixels:s,aggregation:r}=o;if(t||n.dataChanged||n.updateTriggersChanged||n.viewportChanged||r!==i.aggregation||s!==i.cellSizePixels){const{width:l,height:c}=this.context.viewport,{aggregator:u}=this.state;u instanceof T&&u.setProps({binIdRange:[[0,Math.ceil(l/s)],[0,Math.ceil(c/s)]]}),u.setProps({pointCount:this.getNumInstances(),operations:[r],binOptions:{cellSizePixels:s}})}return n.viewportChanged&&this.state.aggregator.setNeedsUpdate(),t}onAttributeChange(e){const{aggregator:t}=this.state;switch(e){case"positions":t.setNeedsUpdate();break;case"counts":t.setNeedsUpdate(0)}}renderLayers(){const{aggregator:e}=this.state,t=this.getSubLayerClass("cells",Ne),o=e.getBins(),i=e.getResult(0);return new t(this.props,this.getSubLayerProps({id:"cell-layer"}),{data:{length:e.binCount,attributes:{getBin:o,getWeight:i}},dataComparator:(n,s)=>n.length===s.length,updateTriggers:{getBin:[o],getWeight:[i]},parameters:{depthWriteEnabled:!1,...this.props.parameters},colorDomain:()=>this.props.colorDomain||e.getResultDomain(0),extensions:[]})}getPickingInfo(e){const t=e.info,{index:o}=t;if(o>=0){const i=this.state.aggregator.getBin(o);let n;i&&(n={col:i.id[0],row:i.id[1],value:i.value[0],count:i.count},i.pointIndices&&(n.pointIndices=i.pointIndices,n.points=Array.isArray(this.props.data)?i.pointIndices.map(s=>this.props.data[s]):[])),t.object=n}return t}};re.layerName="ScreenGridLayer",re.defaultProps=Ht;var $=class{constructor(e,t){this.props={scaleType:"linear",lowerPercentile:0,upperPercentile:100},this.domain=null,this.cutoff=null,this.input=e,this.inputLength=t,this.attribute=e}getScalePercentile(){if(!this._percentile){const e=we(this.input,this.inputLength);this._percentile=Xt(e)}return this._percentile}getScaleOrdinal(){if(!this._ordinal){const e=we(this.input,this.inputLength);this._ordinal=kt(e)}return this._ordinal}getCutoff({scaleType:e,lowerPercentile:t,upperPercentile:o}){if(e==="quantile")return[t,o-1];if(t>0||o<100){const{domain:i}=this.getScalePercentile();let n=i[Math.floor(t)-1]??-1/0,s=i[Math.floor(o)-1]??1/0;if(e==="ordinal"){const{domain:r}=this.getScaleOrdinal();n=r.findIndex(l=>l>=n),s=r.findIndex(l=>l>s)-1,s===-2&&(s=r.length-1)}return[n,s]}return null}update(e){const t=this.props;if(e.scaleType!==t.scaleType)switch(e.scaleType){case"quantile":{const{attribute:o}=this.getScalePercentile();this.attribute=o,this.domain=[0,99];break}case"ordinal":{const{attribute:o,domain:i}=this.getScaleOrdinal();this.attribute=o,this.domain=[0,i.length-1];break}default:this.attribute=this.input,this.domain=null}return(e.scaleType!==t.scaleType||e.lowerPercentile!==t.lowerPercentile||e.upperPercentile!==t.upperPercentile)&&(this.cutoff=this.getCutoff(e)),this.props=e,this}};function kt(e){const t=new Set;for(const n of e)Number.isFinite(n)&&t.add(n);const o=Array.from(t).sort(),i=new Map;for(let n=0;n<o.length;n++)i.set(o[n],n);return{attribute:{value:e.map(n=>Number.isFinite(n)?i.get(n):NaN),type:"float32",size:1},domain:o}}function Xt(e,t=100){const o=Array.from(e).filter(Number.isFinite).sort($t);let i=0;const n=Math.max(1,t),s=new Array(n-1);for(;++i<n;)s[i-1]=Yt(o,i/n);return{attribute:{value:e.map(r=>Number.isFinite(r)?Kt(s,r):NaN),type:"float32",size:1},domain:s}}function we(e,t){const o=(e.stride??4)/4,i=(e.offset??0)/4;let n=e.value;if(!n){const r=e.buffer?.readSyncWebGL(0,o*4*t);r&&(n=new Float32Array(r.buffer),e.value=n)}if(o===1)return n.subarray(0,t);const s=new Float32Array(t);for(let r=0;r<t;r++)s[r]=n[r*o+i];return s}function $t(e,t){return e-t}function Yt(e,t){const o=e.length;if(t<=0||o<2)return e[0];if(t>=1)return e[o-1];const i=(o-1)*t,n=Math.floor(i),s=e[n];return s+(e[n+1]-s)*(i-n)}function Kt(e,t){let o=0,i=e.length;for(;o<i;){const n=o+i>>>1;e[n]>t?i=n:o=n+1}return o}function ae({dataBounds:e,getBinId:t,padding:o=0}){const i=[e[0],e[1],[e[0][0],e[1][1]],[e[1][0],e[0][1]]].map(c=>t(c)),n=Math.min(...i.map(c=>c[0]))-o,s=Math.min(...i.map(c=>c[1]))-o,r=Math.max(...i.map(c=>c[0]))+o+1,l=Math.max(...i.map(c=>c[1]))+o+1;return[[n,r],[s,l]]}var Ee=Math.PI/3,Y=2*Math.sin(Ee),K=1.5,qt=Array.from({length:6},(e,t)=>{const o=t*Ee;return[Math.sin(o),-Math.cos(o)]});function le([e,t],o){let i=Math.round(t=t/o/K),n=Math.round(e=e/o/Y-(i&1)/2);const s=t-i;if(Math.abs(s)*3>1){const r=e-n,l=n+(e<n?-1:1)/2,c=i+(t<i?-1:1),u=e-l,d=t-c;r*r+s*s>u*u+d*d&&(n=l+(i&1?1:-1)/2,i=c)}return[n,i]}var Zt=`
const vec2 DIST = vec2(${Y}, ${K});

ivec2 pointToHexbin(vec2 p, float radius) {
  p /= radius * DIST;
  float pj = round(p.y);
  float pjm2 = mod(pj, 2.0);
  p.x -= pjm2 * 0.5;
  float pi = round(p.x);
  vec2 d1 = p - vec2(pi, pj);

  if (abs(d1.y) * 3. > 1.) {
    vec2 v2 = step(0.0, d1) - 0.5;
    v2.y *= 2.0;
    vec2 d2 = d1 - v2;
    if (dot(d1, d1) > dot(d2, d2)) {
      pi += v2.x + pjm2 - 0.5;
      pj += v2.y;
    }
  }
  return ivec2(pi, pj);
}
`;function Me([e,t],o){return[(e+(t&1)/2)*o*Y,t*o*K]}var Qt=`#version 300 es
#define SHADER_NAME hexagon-cell-layer-vertex-shader
in vec3 positions;
in vec3 normals;
in vec2 instancePositions;
in float instanceElevationValues;
in float instanceColorValues;
in vec3 instancePickingColors;
uniform sampler2D colorRange;
out vec4 vColor;
${`
const vec2 DIST = vec2(${Y}, ${K});

vec2 hexbinCentroid(vec2 binId, float radius) {
  binId.x += fract(binId.y * 0.5);
  return binId * DIST * radius;
}
`}
float interp(float value, vec2 domain, vec2 range) {
float r = min(max((value - domain.x) / (domain.y - domain.x), 0.), 1.);
return mix(range.x, range.y, r);
}
vec4 interp(float value, vec2 domain, sampler2D range) {
float r = (value - domain.x) / (domain.y - domain.x);
return texture(range, vec2(r, 0.5));
}
void main(void) {
geometry.pickingColor = instancePickingColors;
if (isnan(instanceColorValues) ||
instanceColorValues < hexagon.colorDomain.z ||
instanceColorValues > hexagon.colorDomain.w ||
instanceElevationValues < hexagon.elevationDomain.z ||
instanceElevationValues > hexagon.elevationDomain.w
) {
gl_Position = vec4(0.);
return;
}
vec2 commonPosition = hexbinCentroid(instancePositions, column.radius) + (hexagon.originCommon - project.commonOrigin.xy);
commonPosition += positions.xy * column.radius * column.coverage;
geometry.position = vec4(commonPosition, 0.0, 1.0);
geometry.normal = project_normal(normals);
float elevation = 0.0;
if (column.extruded) {
elevation = interp(instanceElevationValues, hexagon.elevationDomain.xy, hexagon.elevationRange);
elevation = project_size(elevation);
geometry.position.z = (positions.z + 1.0) / 2.0 * elevation;
}
gl_Position = project_common_position_to_clipspace(geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vColor = interp(instanceColorValues, hexagon.colorDomain.xy, colorRange);
vColor.a *= layer.opacity;
if (column.extruded) {
vColor.rgb = lighting_getLightColor(vColor.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,Jt={name:"hexagon",vs:`layout(std140) uniform hexagonUniforms {
  vec4 colorDomain;
  vec4 elevationDomain;
  vec2 elevationRange;
  vec2 originCommon;
} hexagon;
`,uniformTypes:{colorDomain:"vec4<f32>",elevationDomain:"vec4<f32>",elevationRange:"vec2<f32>",originCommon:"vec2<f32>"}},Ie=class extends be{getShaders(){const e=super.getShaders();return e.modules.push(Jt),{...e,vs:Qt}}initializeState(){super.initializeState();const e=this.getAttributeManager();e.remove(["instanceElevations","instanceFillColors","instanceLineColors","instanceStrokeWidths"]),e.addInstanced({instancePositions:{size:2,type:"float32",accessor:"getBin"},instanceColorValues:{size:1,type:"float32",accessor:"getColorValue"},instanceElevationValues:{size:1,type:"float32",accessor:"getElevationValue"}})}updateState(e){super.updateState(e);const{props:t,oldProps:o}=e,i=this.state.fillModel;if(o.colorRange!==t.colorRange){this.state.colorTexture?.destroy(),this.state.colorTexture=se(this.context.device,t.colorRange,t.colorScaleType);const n={colorRange:this.state.colorTexture};i.shaderInputs.setProps({hexagon:n})}else o.colorScaleType!==t.colorScaleType&&ne(this.state.colorTexture,t.colorScaleType)}finalizeState(e){super.finalizeState(e),this.state.colorTexture?.destroy()}draw({uniforms:e}){const{radius:t,hexOriginCommon:o,elevationRange:i,elevationScale:n,extruded:s,coverage:r,colorDomain:l,elevationDomain:c}=this.props,u=this.props.colorCutoff||[-1/0,1/0],d=this.props.elevationCutoff||[-1/0,1/0],h=this.state.fillModel;h.setVertexCount(this.state.fillVertexCount);const p={colorDomain:[Math.max(l[0],u[0]),Math.min(l[1],u[1]),Math.max(l[0]-1,u[0]),Math.min(l[1]+1,u[1])],elevationDomain:[Math.max(c[0],d[0]),Math.min(c[1],d[1]),Math.max(c[0]-1,d[0]),Math.min(c[1]+1,d[1])],elevationRange:[i[0]*n,i[1]*n],originCommon:o};h.shaderInputs.setProps({column:{extruded:s,coverage:r,radius:t},hexagon:p}),h.draw(this.context.renderPass)}};Ie.layerName="HexagonCellLayer";var eo={name:"binOptions",vs:`layout(std140) uniform binOptionsUniforms {
  vec2 hexOriginCommon;
  float radiusCommon;
} binOptions;
`,uniformTypes:{hexOriginCommon:"vec2<f32>",radiusCommon:"f32"}};function Oe(){}var to={gpuAggregation:!0,colorDomain:null,colorRange:k,getColorValue:{type:"accessor",value:null},getColorWeight:{type:"accessor",value:1},colorAggregation:"SUM",lowerPercentile:{type:"number",min:0,max:100,value:0},upperPercentile:{type:"number",min:0,max:100,value:100},colorScaleType:"quantize",onSetColorDomain:Oe,elevationDomain:null,elevationRange:[0,1e3],getElevationValue:{type:"accessor",value:null},getElevationWeight:{type:"accessor",value:1},elevationAggregation:"SUM",elevationScale:{type:"number",min:0,value:1},elevationLowerPercentile:{type:"number",min:0,max:100,value:0},elevationUpperPercentile:{type:"number",min:0,max:100,value:100},elevationScaleType:"linear",onSetElevationDomain:Oe,radius:{type:"number",min:1,value:1e3},coverage:{type:"number",min:0,max:1,value:1},getPosition:{type:"accessor",value:e=>e.position},hexagonAggregator:{type:"function",optional:!0,value:null},extruded:!1,material:!0},ce=class extends E{getAggregatorType(){const{gpuAggregation:e,hexagonAggregator:t,getColorValue:o,getElevationValue:i}=this.props;return e&&(t||o||i)?(j.warn("Features not supported by GPU aggregation, falling back to CPU")(),"cpu"):e&&T.isSupported(this.context.device)?"gpu":"cpu"}createAggregator(e){if(e==="cpu"){const{hexagonAggregator:t,radius:o}=this.props;return new w({dimensions:2,getBin:{sources:["positions"],getValue:({positions:i},n,s)=>{if(t)return t(i,o);const r=this.state.aggregatorViewport.projectPosition(i),{radiusCommon:l,hexOriginCommon:c}=s;return le([r[0]-c[0],r[1]-c[1]],l)}},getValue:[{sources:["colorWeights"],getValue:({colorWeights:i})=>i},{sources:["elevationWeights"],getValue:({elevationWeights:i})=>i}]})}return new T(this.context.device,{dimensions:2,channelCount:2,bufferLayout:this.getAttributeManager().getBufferLayouts({isInstanced:!1}),...super.getShaders({modules:[N,eo],vs:`
  in vec3 positions;
  in vec3 positions64Low;
  in float colorWeights;
  in float elevationWeights;
  
  ${Zt}

  void getBin(out ivec2 binId) {
    vec3 positionCommon = project_position(positions, positions64Low);
    binId = pointToHexbin(positionCommon.xy, binOptions.radiusCommon);
  }
  void getValue(out vec2 value) {
    value = vec2(colorWeights, elevationWeights);
  }
  `})})}initializeState(){super.initializeState(),this.getAttributeManager().add({positions:{size:3,accessor:"getPosition",type:"float64",fp64:this.use64bitPositions()},colorWeights:{size:1,accessor:"getColorWeight"},elevationWeights:{size:1,accessor:"getElevationWeight"}})}updateState(e){const t=super.updateState(e),{props:o,oldProps:i,changeFlags:n}=e,{aggregator:s}=this.state;if((n.dataChanged||!this.state.dataAsArray)&&(o.getColorValue||o.getElevationValue)&&(this.state.dataAsArray=Array.from(ve(o.data).iterable)),t||n.dataChanged||o.radius!==i.radius||o.getColorValue!==i.getColorValue||o.getElevationValue!==i.getElevationValue||o.colorAggregation!==i.colorAggregation||o.elevationAggregation!==i.elevationAggregation){this._updateBinOptions();const{radiusCommon:r,hexOriginCommon:l,binIdRange:c,dataAsArray:u}=this.state;if(s.setProps({binIdRange:c,pointCount:this.getNumInstances(),operations:[o.colorAggregation,o.elevationAggregation],binOptions:{radiusCommon:r,hexOriginCommon:l},onUpdate:this._onAggregationUpdate.bind(this)}),u){const{getColorValue:d,getElevationValue:h}=this.props;s.setProps({customOperations:[d&&(p=>d(p.map(v=>u[v]),{indices:p,data:o.data})),h&&(p=>h(p.map(v=>u[v]),{indices:p,data:o.data}))]})}}return n.updateTriggersChanged&&n.updateTriggersChanged.getColorValue&&s.setNeedsUpdate(0),n.updateTriggersChanged&&n.updateTriggersChanged.getElevationValue&&s.setNeedsUpdate(1),t}_updateBinOptions(){const e=this.getBounds();let t=1,o=[0,0],i=[[0,1],[0,1]],n=this.context.viewport;if(e&&Number.isFinite(e[0][0])){let s=[(e[0][0]+e[1][0])/2,(e[0][1]+e[1][1])/2];const{radius:r}=this.props,{unitsPerMeter:l}=n.getDistanceScales(s);t=l[0]*r;const c=le(n.projectFlat(s),t);s=n.unprojectFlat(Me(c,t));const u=n.constructor;n=n.isGeospatial?new u({longitude:s[0],latitude:s[1],zoom:12}):new ie({position:[s[0],s[1],0],zoom:12}),o=[Math.fround(n.center[0]),Math.fround(n.center[1])],i=ae({dataBounds:e,getBinId:d=>{const h=n.projectFlat(d);return h[0]-=o[0],h[1]-=o[1],le(h,t)},padding:1})}this.setState({radiusCommon:t,hexOriginCommon:o,binIdRange:i,aggregatorViewport:n})}draw(e){e.shaderModuleProps.project&&(e.shaderModuleProps.project.viewport=this.state.aggregatorViewport),super.draw(e)}_onAggregationUpdate({channel:e}){const t=this.getCurrentLayer().props,{aggregator:o}=this.state;if(e===0){const i=o.getResult(0);this.setState({colors:new $(i,o.binCount)}),t.onSetColorDomain(o.getResultDomain(0))}else if(e===1){const i=o.getResult(1);this.setState({elevations:new $(i,o.binCount)}),t.onSetElevationDomain(o.getResultDomain(1))}}onAttributeChange(e){const{aggregator:t}=this.state;switch(e){case"positions":t.setNeedsUpdate(),this._updateBinOptions();const{radiusCommon:o,hexOriginCommon:i,binIdRange:n}=this.state;t.setProps({binIdRange:n,binOptions:{radiusCommon:o,hexOriginCommon:i}});break;case"colorWeights":t.setNeedsUpdate(0);break;case"elevationWeights":t.setNeedsUpdate(1)}}renderLayers(){const{aggregator:e,radiusCommon:t,hexOriginCommon:o}=this.state,{elevationScale:i,colorRange:n,elevationRange:s,extruded:r,coverage:l,material:c,transitions:u,colorScaleType:d,lowerPercentile:h,upperPercentile:p,colorDomain:v,elevationScaleType:x,elevationLowerPercentile:S,elevationUpperPercentile:C,elevationDomain:b}=this.props,_=this.getSubLayerClass("cells",Ie),y=e.getBins(),A=this.state.colors?.update({scaleType:d,lowerPercentile:h,upperPercentile:p}),P=this.state.elevations?.update({scaleType:x,lowerPercentile:S,upperPercentile:C});return!A||!P?null:new _(this.getSubLayerProps({id:"cells"}),{data:{length:e.binCount,attributes:{getBin:y,getColorValue:A.attribute,getElevationValue:P.attribute}},dataComparator:(ee,te)=>ee.length===te.length,updateTriggers:{getBin:[y],getColorValue:[A.attribute],getElevationValue:[P.attribute]},diskResolution:6,vertices:qt,radius:t,hexOriginCommon:o,elevationScale:i,colorRange:n,colorScaleType:d,elevationRange:s,extruded:r,coverage:l,material:c,colorDomain:A.domain||v||e.getResultDomain(0),elevationDomain:P.domain||b||e.getResultDomain(1),colorCutoff:A.cutoff,elevationCutoff:P.cutoff,transitions:u&&{getFillColor:u.getColorValue||u.getColorWeight,getElevation:u.getElevationValue||u.getElevationWeight},extensions:[]})}getPickingInfo(e){const t=e.info,{index:o}=t;if(o>=0){const i=this.state.aggregator.getBin(o);let n;if(i){const s=Me(i.id,this.state.radiusCommon),r=this.context.viewport.unprojectFlat(s);n={col:i.id[0],row:i.id[1],position:r,colorValue:i.value[0],elevationValue:i.value[1],count:i.count},i.pointIndices&&(n.pointIndices=i.pointIndices,n.points=Array.isArray(this.props.data)?i.pointIndices.map(l=>this.props.data[l]):[])}t.object=n}return t}};ce.layerName="HexagonLayer",ce.defaultProps=to;var f=.5,m=1/6,a={N:[0,f],E:[f,0],S:[0,-.5],W:[-.5,0],NE:[f,f],NW:[-.5,f],SE:[f,-.5],SW:[-.5,-.5]},M=[a.W,a.SW,a.S],I=[a.S,a.SE,a.E],O=[a.E,a.NE,a.N],L=[a.NW,a.W,a.N],D=[[-.5,m],[-.5,-.16666666666666666],[-.16666666666666666,-.5],[m,-.5]],W=[[-.16666666666666666,-.5],[m,-.5],[f,-.16666666666666666],[f,m]],R=[[f,-.16666666666666666],[f,m],[m,f],[-.16666666666666666,f]],z=[[-.5,m],[-.5,-.16666666666666666],[m,f],[-.16666666666666666,f]],Le=[a.W,a.SW,a.SE,a.E],De=[a.S,a.SE,a.NE,a.N],We=[a.NW,a.W,a.E,a.NE],Re=[a.NW,a.SW,a.S,a.N],ze=[[-.5,m],[-.5,-.16666666666666666],[f,-.16666666666666666],[f,m]],Be=[[-.16666666666666666,-.5],[m,-.5],[m,f],[-.16666666666666666,f]],oo=[a.NW,a.SW,a.SE,a.NE],Ve=[a.NW,a.SW,a.SE,a.E,a.N],Ue=[a.W,a.SW,a.SE,a.NE,a.N],Fe=[a.NW,a.W,a.S,a.SE,a.NE],Ge=[a.NW,a.SW,a.S,a.E,a.NE],je=[a.NW,a.W,[f,-.16666666666666666],[f,m],a.N],He=[[-.16666666666666666,-.5],[m,-.5],a.E,a.NE,a.N],ke=[[-.5,m],[-.5,-.16666666666666666],a.S,a.SE,a.E],Xe=[a.W,a.SW,a.S,[m,f],[-.16666666666666666,f]],$e=[a.NW,a.W,[-.16666666666666666,-.5],[m,-.5],a.N],Ye=[[-.5,m],[-.5,-.16666666666666666],a.E,a.NE,a.N],Ke=[a.S,a.SE,a.E,[m,f],[-.16666666666666666,f]],qe=[a.W,a.SW,a.S,[f,-.16666666666666666],[f,m]],Ze=[a.W,a.SW,a.SE,a.E,[m,f],[-.16666666666666666,f]],Qe=[[-.5,m],[-.5,-.16666666666666666],a.S,a.SE,a.NE,a.N],Je=[a.NW,a.W,[-.16666666666666666,-.5],[m,-.5],a.E,a.NE],et=[a.NW,a.SW,a.S,[f,-.16666666666666666],[f,m],a.N],B=[a.W,a.SW,a.S,a.E,a.NE,a.N],V=[a.NW,a.W,a.S,a.SE,a.E,a.N],q=[[-.5,m],[-.5,-.16666666666666666],[-.16666666666666666,-.5],[m,-.5],a.E,a.NE,a.N],Z=[a.W,a.SW,a.S,[f,-.16666666666666666],[f,m],[m,f],[-.16666666666666666,f]],Q=[a.NW,a.W,[-.16666666666666666,-.5],[m,-.5],[f,-.16666666666666666],[f,m],a.N],J=[[-.5,m],[-.5,-.16666666666666666],a.S,a.SE,a.E,[m,f],[-.16666666666666666,f]],tt=[[-.5,m],[-.5,-.16666666666666666],[-.16666666666666666,-.5],[m,-.5],[f,-.16666666666666666],[f,m],[m,f],[-.16666666666666666,f]],io={0:[],1:[[a.W,a.S]],2:[[a.S,a.E]],3:[[a.W,a.E]],4:[[a.N,a.E]],5:{0:[[a.W,a.S],[a.N,a.E]],1:[[a.W,a.N],[a.S,a.E]]},6:[[a.N,a.S]],7:[[a.W,a.N]],8:[[a.W,a.N]],9:[[a.N,a.S]],10:{0:[[a.W,a.N],[a.S,a.E]],1:[[a.W,a.S],[a.N,a.E]]},11:[[a.N,a.E]],12:[[a.W,a.E]],13:[[a.S,a.E]],14:[[a.W,a.S]],15:[]};function g(e){return parseInt(e,4)}var no={[g("0000")]:[],[g("2222")]:[],[g("2221")]:[M],[g("2212")]:[I],[g("2122")]:[O],[g("1222")]:[L],[g("0001")]:[M],[g("0010")]:[I],[g("0100")]:[O],[g("1000")]:[L],[g("2220")]:[D],[g("2202")]:[W],[g("2022")]:[R],[g("0222")]:[z],[g("0002")]:[D],[g("0020")]:[W],[g("0200")]:[R],[g("2000")]:[z],[g("0011")]:[Le],[g("0110")]:[De],[g("1100")]:[We],[g("1001")]:[Re],[g("2211")]:[Le],[g("2112")]:[De],[g("1122")]:[We],[g("1221")]:[Re],[g("2200")]:[ze],[g("2002")]:[Be],[g("0022")]:[ze],[g("0220")]:[Be],[g("1111")]:[oo],[g("1211")]:[Ve],[g("2111")]:[Ue],[g("1112")]:[Fe],[g("1121")]:[Ge],[g("1011")]:[Ve],[g("0111")]:[Ue],[g("1110")]:[Fe],[g("1101")]:[Ge],[g("1200")]:[je],[g("0120")]:[He],[g("0012")]:[ke],[g("2001")]:[Xe],[g("1022")]:[je],[g("2102")]:[He],[g("2210")]:[ke],[g("0221")]:[Xe],[g("1002")]:[$e],[g("2100")]:[Ye],[g("0210")]:[Ke],[g("0021")]:[qe],[g("1220")]:[$e],[g("0122")]:[Ye],[g("2012")]:[Ke],[g("2201")]:[qe],[g("0211")]:[Ze],[g("2110")]:[Qe],[g("1102")]:[Je],[g("1021")]:[et],[g("2011")]:[Ze],[g("0112")]:[Qe],[g("1120")]:[Je],[g("1201")]:[et],[g("2101")]:[B],[g("0121")]:[B],[g("1012")]:[V],[g("1210")]:[V],[g("0101")]:{0:[M,O],1:[B],2:[B]},[g("1010")]:{0:[L,I],1:[V],2:[V]},[g("2121")]:{0:[B],1:[B],2:[M,O]},[g("1212")]:{0:[V],1:[V],2:[L,I]},[g("2120")]:{0:[q],1:[q],2:[D,O]},[g("2021")]:{0:[Z],1:[Z],2:[M,R]},[g("1202")]:{0:[Q],1:[Q],2:[L,W]},[g("0212")]:{0:[J],1:[J],2:[I,z]},[g("0102")]:{0:[D,O],1:[q],2:[q]},[g("0201")]:{0:[M,R],1:[Z],2:[Z]},[g("1020")]:{0:[L,W],1:[Q],2:[Q]},[g("2010")]:{0:[I,z],1:[J],2:[J]},[g("2020")]:{0:[z,W],1:[tt],2:[D,R]},[g("0202")]:{0:[R,D],1:[tt],2:[z,W]}};function F(e,t){return Number.isNaN(e)?0:Array.isArray(t)?e<t[0]?0:e<t[1]?1:2:e>=t?1:0}function so(e){const{x:t,y:o,xRange:i,yRange:n,getValue:s,threshold:r}=e,l=t<i[0],c=t>=i[1]-1,u=o<n[0],d=o>=n[1]-1,h=l||c||u||d;let p=0,v,x,S,C;if(l||d)S=0;else{const y=s(t,o+1);S=F(y,r),p+=y}if(c||d)C=0;else{const y=s(t+1,o+1);C=F(y,r),p+=y}if(c||u)x=0;else{const y=s(t+1,o);x=F(y,r),p+=y}if(l||u)v=0;else{const y=s(t,o);v=F(y,r),p+=y}let b=-1;Number.isFinite(r)&&(b=S<<3|C<<2|x<<1|v),Array.isArray(r)&&(b=S<<6|C<<4|x<<2|v);let _=0;return h||(_=F(p/4,r)),{code:b,meanCode:_}}function ro(e){const{x:t,y:o,z:i,code:n,meanCode:s}=e;let r=no[n];Array.isArray(r)||(r=r[s]);const l=t+1,c=o+1,u=[];return r.forEach(d=>{const h=[];d.forEach(p=>{const v=l+p[0],x=c+p[1];h.push([v,x,i])}),u.push(h)}),u}function ao(e){const{x:t,y:o,z:i,code:n,meanCode:s}=e;let r=io[n];Array.isArray(r)||(r=r[s]);const l=t+1,c=o+1,u=[];return r.forEach(d=>{d.forEach(h=>{const p=l+h[0],v=c+h[1];u.push([p,v,i])})}),u}function lo({contours:e,getValue:t,xRange:o,yRange:i}){const n=[],s=[];let r=0,l=0;for(let c=0;c<e.length;c++){const u=e[c],d=u.zIndex??c,{threshold:h}=u;for(let p=o[0]-1;p<o[1];p++)for(let v=i[0]-1;v<i[1];v++){const{code:x,meanCode:S}=so({getValue:t,threshold:h,x:p,y:v,xRange:o,yRange:i}),C={x:p,y:v,z:d,code:x,meanCode:S};if(Array.isArray(h)){const b=ro(C);for(const _ of b)s[l++]={vertices:_,contour:u}}else{const b=ao(C);b.length>0&&(n[r++]={vertices:b,contour:u})}}}return{lines:n,polygons:s}}function co(e){const{aggregator:t,binIdRange:o,channel:i}=e;if(t instanceof T){const n=t.getResult(i)?.buffer;if(n)return uo(new Float32Array(n.readSyncWebGL().buffer),o)}if(t instanceof w){const n=t.getResult(i)?.value,s=t.getBins()?.value;if(s&&n)return go(n,s,t.binCount)}return null}function uo(e,t){const[[o,i],[n,s]]=t,r=i-o,l=s-n;return(c,u)=>(c-=o,u-=n,c<0||c>=r||u<0||u>=l?NaN:e[u*r+c])}function go(e,t,o){const i={};for(let n=0;n<o;n++){const s=t[n*2],r=t[n*2+1];i[s]=i[s]||{},i[s][r]=e[n]}return(n,s)=>i[n]?.[s]??NaN}var ho={name:"binOptions",vs:`layout(std140) uniform binOptionsUniforms {
  vec2 cellOriginCommon;
  vec2 cellSizeCommon;
} binOptions;
`,uniformTypes:{cellOriginCommon:"vec2<f32>",cellSizeCommon:"vec2<f32>"}},ot=[255,255,255,255],po=1,fo={cellSize:{type:"number",min:1,value:1e3},gridOrigin:{type:"array",compare:!0,value:[0,0]},getPosition:{type:"accessor",value:e=>e.position},getWeight:{type:"accessor",value:1},gpuAggregation:!0,aggregation:"SUM",contours:{type:"object",value:[{threshold:1}],optional:!0,compare:3},zOffset:.005},ue=class extends E{getAggregatorType(){return this.props.gpuAggregation&&T.isSupported(this.context.device)?"gpu":"cpu"}createAggregator(e){return e==="cpu"?new w({dimensions:2,getBin:{sources:["positions"],getValue:({positions:t},o,i)=>{const n=this.state.aggregatorViewport.projectPosition(t),{cellSizeCommon:s,cellOriginCommon:r}=i;return[Math.floor((n[0]-r[0])/s[0]),Math.floor((n[1]-r[1])/s[1])]}},getValue:[{sources:["counts"],getValue:({counts:t})=>t}],onUpdate:this._onAggregationUpdate.bind(this)}):new T(this.context.device,{dimensions:2,channelCount:1,bufferLayout:this.getAttributeManager().getBufferLayouts({isInstanced:!1}),...super.getShaders({modules:[N,ho],vs:`
  in vec3 positions;
  in vec3 positions64Low;
  in float counts;

  void getBin(out ivec2 binId) {
    vec3 positionCommon = project_position(positions, positions64Low);
    vec2 gridCoords = floor(positionCommon.xy / binOptions.cellSizeCommon);
    binId = ivec2(gridCoords);
  }
  void getValue(out float value) {
    value = counts;
  }
  `}),onUpdate:this._onAggregationUpdate.bind(this)})}initializeState(){super.initializeState(),this.getAttributeManager().add({positions:{size:3,accessor:"getPosition",type:"float64",fp64:this.use64bitPositions()},counts:{size:1,accessor:"getWeight"}})}updateState(e){const t=super.updateState(e),{props:o,oldProps:i,changeFlags:n}=e,{aggregator:s}=this.state;if(t||n.dataChanged||o.cellSize!==i.cellSize||!U(o.gridOrigin,i.gridOrigin,1)||o.aggregation!==i.aggregation){this._updateBinOptions();const{cellSizeCommon:r,cellOriginCommon:l,binIdRange:c}=this.state;s.setProps({binIdRange:c,pointCount:this.getNumInstances(),operations:[o.aggregation],binOptions:{cellSizeCommon:r,cellOriginCommon:l}})}return U(i.contours,o.contours,2)||this.setState({contourData:null}),t}_updateBinOptions(){const e=this.getBounds(),t=[1,1];let o=[0,0],i=[[0,1],[0,1]],n=this.context.viewport;if(e&&Number.isFinite(e[0][0])){let s=[(e[0][0]+e[1][0])/2,(e[0][1]+e[1][1])/2];const{cellSize:r,gridOrigin:l}=this.props,{unitsPerMeter:c}=n.getDistanceScales(s);t[0]=c[0]*r,t[1]=c[1]*r;const u=n.projectFlat(s);o=[Math.floor((u[0]-l[0])/t[0])*t[0]+l[0],Math.floor((u[1]-l[1])/t[1])*t[1]+l[1]],s=n.unprojectFlat(o);const d=n.constructor;n=n.isGeospatial?new d({longitude:s[0],latitude:s[1],zoom:12}):new ie({position:[s[0],s[1],0],zoom:12}),o=[Math.fround(n.center[0]),Math.fround(n.center[1])],i=ae({dataBounds:e,getBinId:h=>{const p=n.projectFlat(h);return[Math.floor((p[0]-o[0])/t[0]),Math.floor((p[1]-o[1])/t[1])]}})}this.setState({cellSizeCommon:t,cellOriginCommon:o,binIdRange:i,aggregatorViewport:n})}draw(e){e.shaderModuleProps.project&&(e.shaderModuleProps.project.viewport=this.state.aggregatorViewport),super.draw(e)}_onAggregationUpdate(){const{aggregator:e,binIdRange:t}=this.state;this.setState({aggregatedValueReader:co({aggregator:e,binIdRange:t,channel:0}),contourData:null})}_getContours(){const{aggregatedValueReader:e}=this.state;if(!e)return null;if(!this.state.contourData){const{binIdRange:t}=this.state,{contours:o}=this.props,i=lo({contours:o,getValue:e,xRange:t[0],yRange:t[1]});this.state.contourData=i}return this.state.contourData}onAttributeChange(e){const{aggregator:t}=this.state;switch(e){case"positions":t.setNeedsUpdate(),this._updateBinOptions();const{cellSizeCommon:o,cellOriginCommon:i,binIdRange:n}=this.state;t.setProps({binIdRange:n,binOptions:{cellSizeCommon:o,cellOriginCommon:i}});break;case"counts":t.setNeedsUpdate(0)}}renderLayers(){const e=this._getContours();if(!e)return null;const{lines:t,polygons:o}=e,{zOffset:i}=this.props,{cellOriginCommon:n,cellSizeCommon:s}=this.state,r=this.getSubLayerClass("lines",ft),l=this.getSubLayerClass("bands",vt),c=new dt().translate([n[0],n[1],0]).scale([s[0],s[1],i]);return[t&&t.length>0&&new r(this.getSubLayerProps({id:"lines"}),{data:t,coordinateSystem:ye.CARTESIAN,modelMatrix:c,getPath:u=>u.vertices,getColor:u=>u.contour.color??ot,getWidth:u=>u.contour.strokeWidth??po,widthUnits:"pixels"}),o&&o.length>0&&new l(this.getSubLayerProps({id:"bands"}),{data:o,coordinateSystem:ye.CARTESIAN,modelMatrix:c,getPolygon:u=>u.vertices,getFillColor:u=>u.contour.color??ot})]}getPickingInfo(e){const t=e.info,{object:o}=t;return o&&(t.object={contour:o.contour}),t}};ue.layerName="ContourLayer",ue.defaultProps=fo;var mo=`#version 300 es
#define SHADER_NAME grid-cell-layer-vertex-shader
in vec3 positions;
in vec3 normals;
in vec2 instancePositions;
in float instanceElevationValues;
in float instanceColorValues;
in vec3 instancePickingColors;
uniform sampler2D colorRange;
out vec4 vColor;
float interp(float value, vec2 domain, vec2 range) {
float r = min(max((value - domain.x) / (domain.y - domain.x), 0.), 1.);
return mix(range.x, range.y, r);
}
vec4 interp(float value, vec2 domain, sampler2D range) {
float r = (value - domain.x) / (domain.y - domain.x);
return texture(range, vec2(r, 0.5));
}
void main(void) {
geometry.pickingColor = instancePickingColors;
if (isnan(instanceColorValues) ||
instanceColorValues < grid.colorDomain.z ||
instanceColorValues > grid.colorDomain.w ||
instanceElevationValues < grid.elevationDomain.z ||
instanceElevationValues > grid.elevationDomain.w
) {
gl_Position = vec4(0.);
return;
}
vec2 commonPosition = (instancePositions + (positions.xy + 1.0) / 2.0 * column.coverage) * grid.sizeCommon + grid.originCommon - project.commonOrigin.xy;
geometry.position = vec4(commonPosition, 0.0, 1.0);
geometry.normal = project_normal(normals);
float elevation = 0.0;
if (column.extruded) {
elevation = interp(instanceElevationValues, grid.elevationDomain.xy, grid.elevationRange);
elevation = project_size(elevation);
geometry.position.z = (positions.z + 1.0) / 2.0 * elevation;
}
gl_Position = project_common_position_to_clipspace(geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vColor = interp(instanceColorValues, grid.colorDomain.xy, colorRange);
vColor.a *= layer.opacity;
if (column.extruded) {
vColor.rgb = lighting_getLightColor(vColor.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,vo={name:"grid",vs:`layout(std140) uniform gridUniforms {
  vec4 colorDomain;
  vec4 elevationDomain;
  vec2 elevationRange;
  vec2 originCommon;
  vec2 sizeCommon;
} grid;
`,uniformTypes:{colorDomain:"vec4<f32>",elevationDomain:"vec4<f32>",elevationRange:"vec2<f32>",originCommon:"vec2<f32>",sizeCommon:"vec2<f32>"}},it=class extends be{getShaders(){const e=super.getShaders();return e.modules.push(vo),{...e,vs:mo}}initializeState(){super.initializeState();const e=this.getAttributeManager();e.remove(["instanceElevations","instanceFillColors","instanceLineColors","instanceStrokeWidths"]),e.addInstanced({instancePositions:{size:2,type:"float32",accessor:"getBin"},instanceColorValues:{size:1,type:"float32",accessor:"getColorValue"},instanceElevationValues:{size:1,type:"float32",accessor:"getElevationValue"}})}updateState(e){super.updateState(e);const{props:t,oldProps:o}=e,i=this.state.fillModel;if(o.colorRange!==t.colorRange){this.state.colorTexture?.destroy(),this.state.colorTexture=se(this.context.device,t.colorRange,t.colorScaleType);const n={colorRange:this.state.colorTexture};i.shaderInputs.setProps({grid:n})}else o.colorScaleType!==t.colorScaleType&&ne(this.state.colorTexture,t.colorScaleType)}finalizeState(e){super.finalizeState(e),this.state.colorTexture?.destroy()}_updateGeometry(){const e=new xt;this.state.fillModel.setGeometry(e)}draw({uniforms:e}){const{cellOriginCommon:t,cellSizeCommon:o,elevationRange:i,elevationScale:n,extruded:s,coverage:r,colorDomain:l,elevationDomain:c}=this.props,u=this.props.colorCutoff||[-1/0,1/0],d=this.props.elevationCutoff||[-1/0,1/0],h=this.state.fillModel,p={colorDomain:[Math.max(l[0],u[0]),Math.min(l[1],u[1]),Math.max(l[0]-1,u[0]),Math.min(l[1]+1,u[1])],elevationDomain:[Math.max(c[0],d[0]),Math.min(c[1],d[1]),Math.max(c[0]-1,d[0]),Math.min(c[1]+1,d[1])],elevationRange:[i[0]*n,i[1]*n],originCommon:t,sizeCommon:o};h.shaderInputs.setProps({column:{extruded:s,coverage:r},grid:p}),h.draw(this.context.renderPass)}};it.layerName="GridCellLayer";var xo={name:"binOptions",vs:`layout(std140) uniform binOptionsUniforms {
  vec2 cellOriginCommon;
  vec2 cellSizeCommon;
} binOptions;
`,uniformTypes:{cellOriginCommon:"vec2<f32>",cellSizeCommon:"vec2<f32>"}};function nt(){}var yo={gpuAggregation:!0,colorDomain:null,colorRange:k,getColorValue:{type:"accessor",value:null},getColorWeight:{type:"accessor",value:1},colorAggregation:"SUM",lowerPercentile:{type:"number",min:0,max:100,value:0},upperPercentile:{type:"number",min:0,max:100,value:100},colorScaleType:"quantize",onSetColorDomain:nt,elevationDomain:null,elevationRange:[0,1e3],getElevationValue:{type:"accessor",value:null},getElevationWeight:{type:"accessor",value:1},elevationAggregation:"SUM",elevationScale:{type:"number",min:0,value:1},elevationLowerPercentile:{type:"number",min:0,max:100,value:0},elevationUpperPercentile:{type:"number",min:0,max:100,value:100},elevationScaleType:"linear",onSetElevationDomain:nt,cellSize:{type:"number",min:0,value:1e3},coverage:{type:"number",min:0,max:1,value:1},getPosition:{type:"accessor",value:e=>e.position},gridAggregator:{type:"function",optional:!0,value:null},extruded:!1,material:!0},ge=class extends E{getAggregatorType(){const{gpuAggregation:e,gridAggregator:t,getColorValue:o,getElevationValue:i}=this.props;return e&&(t||o||i)?(j.warn("Features not supported by GPU aggregation, falling back to CPU")(),"cpu"):e&&T.isSupported(this.context.device)?"gpu":"cpu"}createAggregator(e){if(e==="cpu"){const{gridAggregator:t,cellSize:o}=this.props;return new w({dimensions:2,getBin:{sources:["positions"],getValue:({positions:i},n,s)=>{if(t)return t(i,o);const r=this.state.aggregatorViewport.projectPosition(i),{cellSizeCommon:l,cellOriginCommon:c}=s;return[Math.floor((r[0]-c[0])/l[0]),Math.floor((r[1]-c[1])/l[1])]}},getValue:[{sources:["colorWeights"],getValue:({colorWeights:i})=>i},{sources:["elevationWeights"],getValue:({elevationWeights:i})=>i}]})}return new T(this.context.device,{dimensions:2,channelCount:2,bufferLayout:this.getAttributeManager().getBufferLayouts({isInstanced:!1}),...super.getShaders({modules:[N,xo],vs:`
  in vec3 positions;
  in vec3 positions64Low;
  in float colorWeights;
  in float elevationWeights;

  void getBin(out ivec2 binId) {
    vec3 positionCommon = project_position(positions, positions64Low);
    vec2 gridCoords = floor(positionCommon.xy / binOptions.cellSizeCommon);
    binId = ivec2(gridCoords);
  }
  void getValue(out vec2 value) {
    value = vec2(colorWeights, elevationWeights);
  }
  `})})}initializeState(){super.initializeState(),this.getAttributeManager().add({positions:{size:3,accessor:"getPosition",type:"float64",fp64:this.use64bitPositions()},colorWeights:{size:1,accessor:"getColorWeight"},elevationWeights:{size:1,accessor:"getElevationWeight"}})}updateState(e){const t=super.updateState(e),{props:o,oldProps:i,changeFlags:n}=e,{aggregator:s}=this.state;if((n.dataChanged||!this.state.dataAsArray)&&(o.getColorValue||o.getElevationValue)&&(this.state.dataAsArray=Array.from(ve(o.data).iterable)),t||n.dataChanged||o.cellSize!==i.cellSize||o.getColorValue!==i.getColorValue||o.getElevationValue!==i.getElevationValue||o.colorAggregation!==i.colorAggregation||o.elevationAggregation!==i.elevationAggregation){this._updateBinOptions();const{cellSizeCommon:r,cellOriginCommon:l,binIdRange:c,dataAsArray:u}=this.state;if(s.setProps({binIdRange:c,pointCount:this.getNumInstances(),operations:[o.colorAggregation,o.elevationAggregation],binOptions:{cellSizeCommon:r,cellOriginCommon:l},onUpdate:this._onAggregationUpdate.bind(this)}),u){const{getColorValue:d,getElevationValue:h}=this.props;s.setProps({customOperations:[d&&(p=>d(p.map(v=>u[v]),{indices:p,data:o.data})),h&&(p=>h(p.map(v=>u[v]),{indices:p,data:o.data}))]})}}return n.updateTriggersChanged&&n.updateTriggersChanged.getColorValue&&s.setNeedsUpdate(0),n.updateTriggersChanged&&n.updateTriggersChanged.getElevationValue&&s.setNeedsUpdate(1),t}_updateBinOptions(){const e=this.getBounds(),t=[1,1];let o=[0,0],i=[[0,1],[0,1]],n=this.context.viewport;if(e&&Number.isFinite(e[0][0])){let s=[(e[0][0]+e[1][0])/2,(e[0][1]+e[1][1])/2];const{cellSize:r}=this.props,{unitsPerMeter:l}=n.getDistanceScales(s);t[0]=l[0]*r,t[1]=l[1]*r;const c=n.projectFlat(s);o=[Math.floor(c[0]/t[0])*t[0],Math.floor(c[1]/t[1])*t[1]],s=n.unprojectFlat(o);const u=n.constructor;n=n.isGeospatial?new u({longitude:s[0],latitude:s[1],zoom:12}):new ie({position:[s[0],s[1],0],zoom:12}),o=[Math.fround(n.center[0]),Math.fround(n.center[1])],i=ae({dataBounds:e,getBinId:d=>{const h=n.projectFlat(d);return[Math.floor((h[0]-o[0])/t[0]),Math.floor((h[1]-o[1])/t[1])]}})}this.setState({cellSizeCommon:t,cellOriginCommon:o,binIdRange:i,aggregatorViewport:n})}draw(e){e.shaderModuleProps.project&&(e.shaderModuleProps.project.viewport=this.state.aggregatorViewport),super.draw(e)}_onAggregationUpdate({channel:e}){const t=this.getCurrentLayer().props,{aggregator:o}=this.state;if(e===0){const i=o.getResult(0);this.setState({colors:new $(i,o.binCount)}),t.onSetColorDomain(o.getResultDomain(0))}else if(e===1){const i=o.getResult(1);this.setState({elevations:new $(i,o.binCount)}),t.onSetElevationDomain(o.getResultDomain(1))}}onAttributeChange(e){const{aggregator:t}=this.state;switch(e){case"positions":t.setNeedsUpdate(),this._updateBinOptions();const{cellSizeCommon:o,cellOriginCommon:i,binIdRange:n}=this.state;t.setProps({binIdRange:n,binOptions:{cellSizeCommon:o,cellOriginCommon:i}});break;case"colorWeights":t.setNeedsUpdate(0);break;case"elevationWeights":t.setNeedsUpdate(1)}}renderLayers(){const{aggregator:e,cellOriginCommon:t,cellSizeCommon:o}=this.state,{elevationScale:i,colorRange:n,elevationRange:s,extruded:r,coverage:l,material:c,transitions:u,colorScaleType:d,lowerPercentile:h,upperPercentile:p,colorDomain:v,elevationScaleType:x,elevationLowerPercentile:S,elevationUpperPercentile:C,elevationDomain:b}=this.props,_=this.getSubLayerClass("cells",it),y=e.getBins(),A=this.state.colors?.update({scaleType:d,lowerPercentile:h,upperPercentile:p}),P=this.state.elevations?.update({scaleType:x,lowerPercentile:S,upperPercentile:C});return!A||!P?null:new _(this.getSubLayerProps({id:"cells"}),{data:{length:e.binCount,attributes:{getBin:y,getColorValue:A.attribute,getElevationValue:P.attribute}},dataComparator:(ee,te)=>ee.length===te.length,updateTriggers:{getBin:[y],getColorValue:[A.attribute],getElevationValue:[P.attribute]},cellOriginCommon:t,cellSizeCommon:o,elevationScale:i,colorRange:n,colorScaleType:d,elevationRange:s,extruded:r,coverage:l,material:c,colorDomain:A.domain||v||e.getResultDomain(0),elevationDomain:P.domain||b||e.getResultDomain(1),colorCutoff:A.cutoff,elevationCutoff:P.cutoff,transitions:u&&{getFillColor:u.getColorValue||u.getColorWeight,getElevation:u.getElevationValue||u.getElevationWeight},extensions:[]})}getPickingInfo(e){const t=e.info,{index:o}=t;if(o>=0){const i=this.state.aggregator.getBin(o);let n;i&&(n={col:i.id[0],row:i.id[1],colorValue:i.value[0],elevationValue:i.value[1],count:i.count},i.pointIndices&&(n.pointIndices=i.pointIndices,n.points=Array.isArray(this.props.data)?i.pointIndices.map(s=>this.props.data[s]):[])),t.object=n}return t}};ge.layerName="GridLayer",ge.defaultProps=yo;function bo(e){const t=e.map(s=>s[0]),o=e.map(s=>s[1]),i=Math.min.apply(null,t),n=Math.max.apply(null,t);return[i,Math.min.apply(null,o),n,Math.max.apply(null,o)]}function Co(e,t){return t[0]>=e[0]&&t[2]<=e[2]&&t[1]>=e[1]&&t[3]<=e[3]}var st=new Float32Array(12);function rt(e,t=2){let o=0;for(const i of e)for(let n=0;n<t;n++)st[o++]=i[n]||0;return st}function So(e,t,o){const[i,n,s,r]=e,l=s-i,c=r-n;let u=l,d=c;l/c<t/o?u=t/o*c:d=o/t*l,u<t&&(u=t,d=o);const h=(s+i)/2,p=(r+n)/2;return[h-u/2,p-d/2,h+u/2,p+d/2]}function To(e,t){const[o,i,n,s]=t;return[(e[0]-o)/(n-o),(e[1]-i)/(s-i)]}var _o=`#version 300 es
#define SHADER_NAME heatp-map-layer-vertex-shader
uniform sampler2D maxTexture;
in vec3 positions;
in vec2 texCoords;
out vec2 vTexCoords;
out float vIntensityMin;
out float vIntensityMax;
void main(void) {
gl_Position = project_position_to_clipspace(positions, vec3(0.0), vec3(0.0));
vTexCoords = texCoords;
vec4 maxTexture = texture(maxTexture, vec2(0.5));
float maxValue = triangle.aggregationMode < 0.5 ? maxTexture.r : maxTexture.g;
float minValue = maxValue * triangle.threshold;
if (triangle.colorDomain[1] > 0.) {
maxValue = triangle.colorDomain[1];
minValue = triangle.colorDomain[0];
}
vIntensityMax = triangle.intensity / maxValue;
vIntensityMin = triangle.intensity / minValue;
}
`,Ao=`#version 300 es
#define SHADER_NAME triangle-layer-fragment-shader
precision highp float;
uniform sampler2D weightsTexture;
uniform sampler2D colorTexture;
in vec2 vTexCoords;
in float vIntensityMin;
in float vIntensityMax;
out vec4 fragColor;
vec4 getLinearColor(float value) {
float factor = clamp(value * vIntensityMax, 0., 1.);
vec4 color = texture(colorTexture, vec2(factor, 0.5));
color.a *= min(value * vIntensityMin, 1.0);
return color;
}
void main(void) {
vec4 weights = texture(weightsTexture, vTexCoords);
float weight = weights.r;
if (triangle.aggregationMode > 0.5) {
weight /= max(1.0, weights.a);
}
if (weight <= 0.) {
discard;
}
vec4 linearColor = getLinearColor(weight);
linearColor.a *= layer.opacity;
fragColor = linearColor;
}
`,at=`layout(std140) uniform triangleUniforms {
  float aggregationMode;
  vec2 colorDomain;
  float intensity;
  float threshold;
} triangle;
`,Po={name:"triangle",vs:at,fs:at,uniformTypes:{aggregationMode:"f32",colorDomain:"vec2<f32>",intensity:"f32",threshold:"f32"}},lt=class extends me{getShaders(){return super.getShaders({vs:_o,fs:Ao,modules:[N,Po]})}initializeState({device:e}){this.setState({model:this._getModel(e)})}_getModel(e){const{vertexCount:t,data:o}=this.props;return new G(e,{...this.getShaders(),id:this.props.id,attributes:o.attributes,bufferLayout:[{name:"positions",format:"float32x3"},{name:"texCoords",format:"float32x2"}],topology:"triangle-strip",vertexCount:t})}draw(){const{model:e}=this.state,{aggregationMode:t,colorDomain:o,intensity:i,threshold:n,colorTexture:s,maxTexture:r,weightsTexture:l}=this.props,c={aggregationMode:t,colorDomain:o,intensity:i,threshold:n,colorTexture:s,maxTexture:r,weightsTexture:l};e.shaderInputs.setProps({triangle:c}),e.draw(this.context.renderPass)}};lt.layerName="TriangleLayer";function No(e,t){const o={};for(const i in e)t.includes(i)||(o[i]=e[i]);return o}var ct=class extends xe{initializeAggregationLayer(e){super.initializeState(this.context),this.setState({ignoreProps:No(this.constructor._propTypes,e.data.props),dimensions:e})}updateState(e){super.updateState(e);const{changeFlags:t}=e;if(t.extensionsChanged){const o=this.getShaders({});o&&o.defines&&(o.defines.NON_INSTANCED_MODEL=1),this.updateShaders(o)}this._updateAttributes()}updateAttributes(e){this.setState({changedAttributes:e})}getAttributes(){return this.getAttributeManager().getAttributes()}getModuleSettings(){const{viewport:e,mousePosition:t,device:o}=this.context;return Object.assign(Object.create(this.props),{viewport:e,mousePosition:t,picking:{isActive:0},devicePixelRatio:o.canvasContext.cssToDeviceRatio()})}updateShaders(e){}isAggregationDirty(e,t={}){const{props:o,oldProps:i,changeFlags:n}=e,{compareAll:s=!1,dimension:r}=t,{ignoreProps:l}=this.state,{props:c,accessors:u=[]}=r,{updateTriggersChanged:d}=n;if(n.dataChanged)return!0;if(d){if(d.all)return!0;for(const h of u)if(d[h])return!0}if(s)return n.extensionsChanged?!0:gt({oldProps:i,newProps:o,ignoreProps:l,propTypes:this.constructor._propTypes});for(const h of c)if(o[h]!==i[h])return!0;return!1}isAttributeChanged(e){const{changedAttributes:t}=this.state;return e?t&&t[e]!==void 0:!wo(t)}_getAttributeManager(){return new oe(this.context.device,{id:this.props.id,stats:this.context.stats})}};ct.layerName="AggregationLayer";function wo(e){let t=!0;for(const o in e){t=!1;break}return t}var de=`#version 300 es
in vec3 positions;
in vec3 positions64Low;
in float weights;
out vec4 weightsTexture;
void main()
{
weightsTexture = vec4(weights * weight.weightsScale, 0., 0., 1.);
float radiusTexels = project_pixel_size(weight.radiusPixels) * weight.textureWidth / (weight.commonBounds.z - weight.commonBounds.x);
gl_PointSize = radiusTexels * 2.;
vec3 commonPosition = project_position(positions, positions64Low);
gl_Position.xy = (commonPosition.xy - weight.commonBounds.xy) / (weight.commonBounds.zw - weight.commonBounds.xy) ;
gl_Position.xy = (gl_Position.xy * 2.) - (1.);
gl_Position.w = 1.0;
}
`,he=`#version 300 es
in vec4 weightsTexture;
out vec4 fragColor;
float gaussianKDE(float u){
return pow(2.71828, -u*u/0.05555)/(1.77245385*0.166666);
}
void main()
{
float dist = length(gl_PointCoord - vec2(0.5, 0.5));
if (dist > 0.5) {
discard;
}
fragColor = weightsTexture * gaussianKDE(2. * dist);
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,Eo=`#version 300 es
uniform sampler2D inTexture;
out vec4 outTexture;
void main()
{
int yIndex = gl_VertexID / int(maxWeight.textureSize);
int xIndex = gl_VertexID - (yIndex * int(maxWeight.textureSize));
vec2 uv = (0.5 + vec2(float(xIndex), float(yIndex))) / maxWeight.textureSize;
outTexture = texture(inTexture, uv);
gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
gl_PointSize = 1.0;
}
`,Mo=`#version 300 es
in vec4 outTexture;
out vec4 fragColor;
void main() {
fragColor = outTexture;
fragColor.g = outTexture.r / max(1.0, outTexture.a);
}
`,Io={name:"weight",vs:`layout(std140) uniform weightUniforms {
  vec4 commonBounds;
  float radiusPixels;
  float textureWidth;
  float weightsScale;
} weight;
`,uniformTypes:{commonBounds:"vec4<f32>",radiusPixels:"f32",textureWidth:"f32",weightsScale:"f32"}},Oo={name:"maxWeight",vs:`layout(std140) uniform maxWeightUniforms {
  float textureSize;
} maxWeight;
`,uniformTypes:{textureSize:"f32"}},Lo=2,pe={format:"rgba8unorm",dimension:"2d",width:1,height:1,sampler:{minFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}},ut=[0,0],Do={SUM:0,MEAN:1},Wo={getPosition:{type:"accessor",value:e=>e.position},getWeight:{type:"accessor",value:1},intensity:{type:"number",min:0,value:1},radiusPixels:{type:"number",min:1,max:100,value:50},colorRange:k,threshold:{type:"number",min:0,max:1,value:.05},colorDomain:{type:"array",value:null,optional:!0},aggregation:"SUM",weightsTextureSize:{type:"number",min:128,max:2048,value:2048},debounceTimeout:{type:"number",min:0,max:1e3,value:500}},Ro=["float32-renderable-webgl","texture-blend-float-webgl"],zo={data:{props:["radiusPixels"]}},fe=class extends ct{getShaders(e){let t=[N];return e.modules&&(t=[...t,...e.modules]),super.getShaders({...e,modules:t})}initializeState(){super.initializeAggregationLayer(zo),this.setState({colorDomain:ut}),this._setupTextureParams(),this._setupAttributes(),this._setupResources()}shouldUpdateState({changeFlags:e}){return e.somethingChanged}updateState(e){super.updateState(e),this._updateHeatmapState(e)}_updateHeatmapState(e){const{props:t,oldProps:o}=e,i=this._getChangeFlags(e);if((i.dataChanged||i.viewportChanged)&&(i.boundsChanged=this._updateBounds(i.dataChanged),this._updateTextureRenderingBounds()),i.dataChanged||i.boundsChanged){if(clearTimeout(this.state.updateTimer),this.setState({isWeightMapDirty:!0}),i.dataChanged){const n=this.getShaders({vs:de,fs:he});this._createWeightsTransform(n)}}else i.viewportZoomChanged&&this._debouncedUpdateWeightmap();t.colorRange!==o.colorRange&&this._updateColorTexture(e),this.state.isWeightMapDirty&&this._updateWeightmap(),this.setState({zoom:e.context.viewport.zoom})}renderLayers(){const{weightsTexture:e,triPositionBuffer:t,triTexCoordBuffer:o,maxWeightsTexture:i,colorTexture:n,colorDomain:s}=this.state,{updateTriggers:r,intensity:l,threshold:c,aggregation:u}=this.props;return new(this.getSubLayerClass("triangle",lt))(this.getSubLayerProps({id:"triangle-layer",updateTriggers:r}),{coordinateSystem:"default",data:{attributes:{positions:t,texCoords:o}},vertexCount:4,maxTexture:i,colorTexture:n,aggregationMode:Do[u]||0,weightsTexture:e,intensity:l,threshold:c,colorDomain:s})}finalizeState(e){super.finalizeState(e);const{weightsTransform:t,weightsTexture:o,maxWeightTransform:i,maxWeightsTexture:n,triPositionBuffer:s,triTexCoordBuffer:r,colorTexture:l,updateTimer:c}=this.state;t?.destroy(),o?.destroy(),i?.destroy(),n?.destroy(),s?.destroy(),r?.destroy(),l?.destroy(),c&&clearTimeout(c)}_getAttributeManager(){return new oe(this.context.device,{id:this.props.id,stats:this.context.stats})}_getChangeFlags(e){const t={},{dimensions:o}=this.state;t.dataChanged=this.isAttributeChanged()&&"attribute changed"||this.isAggregationDirty(e,{compareAll:!0,dimension:o.data})&&"aggregation is dirty",t.viewportChanged=e.changeFlags.viewportChanged;const{zoom:i}=this.state;return(!e.context.viewport||e.context.viewport.zoom!==i)&&(t.viewportZoomChanged=!0),t}_createTextures(){const{textureSize:e,format:t}=this.state;this.setState({weightsTexture:this.context.device.createTexture({...pe,width:e,height:e,format:t}),maxWeightsTexture:this.context.device.createTexture({...pe,width:1,height:1,format:t})})}_setupAttributes(){this.getAttributeManager().add({positions:{size:3,type:"float64",accessor:"getPosition"},weights:{size:1,accessor:"getWeight"}}),this.setState({positionAttributeName:"positions"})}_setupTextureParams(){const{device:e}=this.context,{weightsTextureSize:t}=this.props,o=Math.min(t,e.limits.maxTextureDimension2D),i=Ro.every(r=>e.features.has(r)),n=i?"rgba32float":"rgba8unorm",s=i?1:1/255;this.setState({textureSize:o,format:n,weightsScale:s}),i||j.warn(`HeatmapLayer: ${this.id} rendering to float texture not supported, falling back to low precision format`)()}_createWeightsTransform(e){let{weightsTransform:t}=this.state;const{weightsTexture:o}=this.state,i=this.getAttributeManager();t?.destroy(),t=new Ce(this.context.device,{id:`${this.id}-weights-transform`,...e,bufferLayout:i.getBufferLayouts(),vertexCount:1,targetTexture:o,parameters:{depthWriteEnabled:!1,blend:!0,blendColorOperation:"add",blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one"},topology:"point-list",modules:[...e.modules,Io]}),this.setState({weightsTransform:t})}_setupResources(){this._createTextures();const{device:e}=this.context,{textureSize:t,weightsTexture:o,maxWeightsTexture:i}=this.state,n=this.getShaders({vs:de,fs:he});this._createWeightsTransform(n);const s=this.getShaders({vs:Eo,fs:Mo,modules:[Oo]}),r=new Ce(e,{id:`${this.id}-max-weights-transform`,targetTexture:i,...s,vertexCount:t*t,topology:"point-list",parameters:{depthWriteEnabled:!1,blend:!0,blendColorOperation:"max",blendAlphaOperation:"max",blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one"}}),l={inTexture:o,textureSize:t};r.model.shaderInputs.setProps({maxWeight:l}),this.setState({weightsTexture:o,maxWeightsTexture:i,maxWeightTransform:r,zoom:null,triPositionBuffer:e.createBuffer({byteLength:48}),triTexCoordBuffer:e.createBuffer({byteLength:48})})}updateShaders(e){this._createWeightsTransform({vs:de,fs:he,...e})}_updateMaxWeightValue(){const{maxWeightTransform:e}=this.state;e.run({parameters:{viewport:[0,0,1,1]},clearColor:[0,0,0,0]})}_updateBounds(e=!1){const{viewport:t}=this.context,o=[t.unproject([0,0]),t.unproject([t.width,0]),t.unproject([0,t.height]),t.unproject([t.width,t.height])].map(r=>r.map(Math.fround)),i=bo(o),n={visibleWorldBounds:i,viewportCorners:o};let s=!1;if(e||!this.state.worldBounds||!Co(this.state.worldBounds,i)){const r=this._worldToCommonBounds(i),l=this._commonToWorldBounds(r);this.props.coordinateSystem==="lnglat"&&(l[1]=Math.max(l[1],-85.051129),l[3]=Math.min(l[3],85.051129),l[0]=Math.max(l[0],-360),l[2]=Math.min(l[2],360));const c=this._worldToCommonBounds(l);n.worldBounds=l,n.normalizedCommonBounds=c,s=!0}return this.setState(n),s}_updateTextureRenderingBounds(){const{triPositionBuffer:e,triTexCoordBuffer:t,normalizedCommonBounds:o,viewportCorners:i}=this.state,{viewport:n}=this.context;e.write(rt(i,3));const s=i.map(r=>To(n.projectPosition(r),o));t.write(rt(s,2))}_updateColorTexture(e){const{colorRange:t}=e.props;let{colorTexture:o}=this.state;const i=Pe(t,!1,Uint8Array);o?.destroy(),o=this.context.device.createTexture({...pe,data:i,width:t.length,height:1}),this.setState({colorTexture:o})}_updateWeightmap(){const{radiusPixels:e,colorDomain:t,aggregation:o}=this.props,{worldBounds:i,textureSize:n,weightsScale:s,weightsTexture:r}=this.state,l=this.state.weightsTransform;this.state.isWeightMapDirty=!1;const c=this._worldToCommonBounds(i,{useLayerCoordinateSystem:!0});if(t&&o==="SUM"){const{viewport:b}=this.context,_=b.distanceScales.metersPerUnit[2]*(c[2]-c[0])/n;this.state.colorDomain=[t[0]*_*s,t[1]*_*s]}else this.state.colorDomain=t||ut;const u=this.getAttributeManager().getAttributes(),d=this.getModuleSettings();this._setModelAttributes(l.model,u),l.model.setVertexCount(this.getNumInstances());const h={radiusPixels:e,commonBounds:c,textureWidth:n,weightsScale:s,weightsTexture:r},{viewport:p,devicePixelRatio:v,coordinateSystem:x,coordinateOrigin:S}=d,{modelMatrix:C}=this.props;l.model.shaderInputs.setProps({project:{viewport:p,devicePixelRatio:v,modelMatrix:C,coordinateSystem:x,coordinateOrigin:S},weight:h}),l.run({parameters:{viewport:[0,0,n,n]},clearColor:[0,0,0,0]}),this._updateMaxWeightValue()}_debouncedUpdateWeightmap(e=!1){let{updateTimer:t}=this.state;const{debounceTimeout:o}=this.props;e?(t=null,this._updateBounds(!0),this._updateTextureRenderingBounds(),this.setState({isWeightMapDirty:!0})):(this.setState({isWeightMapDirty:!1}),clearTimeout(t),t=setTimeout(this._debouncedUpdateWeightmap.bind(this,!0),o)),this.setState({updateTimer:t})}_worldToCommonBounds(e,t={}){const{useLayerCoordinateSystem:o=!1}=t,[i,n,s,r]=e,{viewport:l}=this.context,{textureSize:c}=this.state,{coordinateSystem:u}=this.props,d=o&&(u==="lnglat-offsets"||u==="meter-offsets"),h=d?l.projectPosition(this.props.coordinateOrigin):[0,0],p=c*Lo/l.scale;let v,x;return o&&!d?(v=this.projectPosition([i,n,0]),x=this.projectPosition([s,r,0])):(v=l.projectPosition([i,n,0]),x=l.projectPosition([s,r,0])),So([v[0]-h[0],v[1]-h[1],x[0]-h[0],x[1]-h[1]],p,p)}_commonToWorldBounds(e){const[t,o,i,n]=e,{viewport:s}=this.context,r=s.unprojectPosition([t,o]),l=s.unprojectPosition([i,n]);return r.slice(0,2).concat(l.slice(0,2))}};fe.layerName="HeatmapLayer",fe.defaultProps=Wo;export{w as CPUAggregator,ue as ContourLayer,ge as GridLayer,fe as HeatmapLayer,ce as HexagonLayer,re as ScreenGridLayer,T as WebGLAggregator,E as _AggregationLayer};
