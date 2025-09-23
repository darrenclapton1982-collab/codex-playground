import * as THREE from 'three';
import { atmosphereConfig } from '../config.js';

export function createAtmosphereMaterial() {
    const uniforms = {
        colorInner: { value: new THREE.Color().fromArray(atmosphereConfig.colorInner) },
        colorOuter: { value: new THREE.Color().fromArray(atmosphereConfig.colorOuter) },
        intensity: { value: atmosphereConfig.intensity }
    };

    const vertexShader = /* glsl */ `
        varying vec3 vWorldPosition;
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
    `;

    const fragmentShader = /* glsl */ `
        uniform vec3 colorInner;
        uniform vec3 colorOuter;
        uniform float intensity;
        varying vec3 vWorldPosition;
        void main() {
            vec3 worldNormal = normalize(vWorldPosition);
            vec3 viewDir = normalize(cameraPosition - vWorldPosition);
            float viewFactor = pow(1.0 - max(dot(viewDir, worldNormal), 0.0), 2.5);
            float horizon = smoothstep(-0.2, 0.6, worldNormal.y);
            vec3 color = mix(colorOuter, colorInner, viewFactor * 0.75 + horizon * 0.2);
            float alpha = clamp(viewFactor * intensity + 0.1, 0.0, 1.0);
            gl_FragColor = vec4(color, alpha);
        }
    `;

    return new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        side: THREE.BackSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
}
