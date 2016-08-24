declare interface ObjectConstructor {
  assign(target: any, ...sources: any[]): any;
}

// if (typeof Object.assign !== 'function') {
//   Object.assign = function(target: any) {
//     'use strict';
//     if (target == null) {
//       throw new TypeError('Cannot convert undefined or null to object');
//     }

//     target = Object(target);
//     for (let index = 1; index < arguments.length; index++) {
//       let source = arguments[index];
//       if (source != null) {
//         for (let key in source) {
//           if (Object.prototype.hasOwnProperty.call(source, key)) {
//             target[key] = source[key];
//           }
//         }
//       }
//     }
//     return target;
//   };
// }
