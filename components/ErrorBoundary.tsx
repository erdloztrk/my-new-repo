import React, { Component, ReactNode } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { XCircle } from "phosphor-react-native";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { logError } from "@/lib/logger";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    logError("[ErrorBoundary] Caught error:", error);
    logError("[ErrorBoundary] Error info:", errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return <DefaultErrorUI error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface DefaultErrorUIProps {
  error: Error | null;
  onReset: () => void;
}

function DefaultErrorUI({ error, onReset }: DefaultErrorUIProps) {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
      }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
            borderRadius: 20,
            padding: 24,
            width: "100%",
            maxWidth: 400,
            alignItems: "center",
            borderWidth: 1,
            borderColor: isDark ? "#334155" : "#E2E8F0",
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: isDark ? "#7F1D1D" : "#FEE2E2",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <XCircle size={32} color="#EF4444" weight="fill" />
          </View>

          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: isDark ? "#F8FAFC" : "#0F172A",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            {t("error_boundary_title") || "Bir Hata Oluştu"}
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: isDark ? "#94A3B8" : "#64748B",
              marginBottom: 24,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            {t("error_boundary_description") || "Uygulamada beklenmeyen bir hata oluştu. Lütfen tekrar deneyin."}
          </Text>

          {error && __DEV__ && (
            <ScrollView
              style={{
                width: "100%",
                maxHeight: 150,
                backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: isDark ? "#334155" : "#E2E8F0",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "monospace",
                  color: isDark ? "#EF4444" : "#DC2626",
                }}
              >
                {error.toString()}
                {error.stack && `\n\n${error.stack}`}
              </Text>
            </ScrollView>
          )}

          <Pressable
            onPress={onReset}
            style={{
              backgroundColor: "#6C63FF",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
              width: "100%",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#FFFFFF",
              }}
            >
              {t("error_boundary_retry") || "Tekrar Dene"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

