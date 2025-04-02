import React from "react";
import { WebView } from "react-native-webview";

const PDFViewerScreen = ({ route }) => {
  const { pdfUrl } = route.params;

  return (
    <WebView
      source={{ uri: pdfUrl }}  // Carregar o PDF usando WebView
      style={{ flex: 1 }}
    />
  );
};

export default PDFViewerScreen;
