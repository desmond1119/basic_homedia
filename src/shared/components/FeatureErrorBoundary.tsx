import { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  featureName: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class FeatureErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
        feature: {
          name: this.props.featureName,
        },
      },
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback featureName={this.props.featureName} error={this.state.error} />;
    }

    return this.props.children;
  }
}

const ErrorFallback = ({ featureName, error }: { featureName: string; error?: Error }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[400px] flex items-center justify-center bg-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md px-6"
      >
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-white mb-3">
          {t('error.featureUnavailable')}
        </h2>
        <p className="text-gray-400 mb-6">
          {t('error.featureError', { feature: featureName })}
        </p>
        {import.meta.env.DEV && error && (
          <div className="bg-gray-900 rounded-lg p-4 text-left">
            <p className="text-red-400 text-sm font-mono">{error.message}</p>
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-100 transition-colors"
        >
          {t('common.reload')}
        </motion.button>
      </motion.div>
    </div>
  );
};

export const FeatureErrorBoundary = Sentry.withErrorBoundary(FeatureErrorBoundaryClass, {
  fallback: ({ error }) => <ErrorFallback featureName="Unknown" error={error as Error} />,
});
