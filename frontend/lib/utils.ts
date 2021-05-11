export const gutterMarker = () => {
  var marker = document.createElement("div");
  marker.className = "debugger-current";
  marker.innerHTML = "►";
  return marker;
};
