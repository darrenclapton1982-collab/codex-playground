import * as THREE from 'three';

export function rgbArrayToThreeColor(rgbArray) {
    const color = new THREE.Color();
    color.setRGB(rgbArray[0], rgbArray[1], rgbArray[2]);
    return color;
}

export function blendColors(a, b, t) {
    return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t
    ];
}
