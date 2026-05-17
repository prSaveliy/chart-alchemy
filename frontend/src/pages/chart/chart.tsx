import { AIChart } from "./ai-chart";
import { ManualChart } from "./manual-chart";
import { DatasetChart } from "./dataset-chart";

import { useParams, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

import { handleUnauthorized } from "@/lib/handleUnauthorized";
import { parseChartKind } from "@/lib/parseChartToken";

import { Error } from "../error";

import chartService from "@/services/chartService";
import type { ManualChartType } from "@/services/chartService";

import type { ChartConfig } from "@/commons/schemas/chartConfig.schema";
import type { DatasetField, DatasetChartType, DatasetInfo } from "@/commons/interfaces/chartInterfaces";

export const Chart = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const retried = useRef(false);

  const [notFoundError, setNotFoundError] = useState(false);
  const [forbiddenError, setForbiddenError] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [tooManyRequestsError, setTooManyRequestsError] = useState(false);

  const [verified, setVerified] = useState(false);
  const [chartData, setChartData] = useState<ChartConfig | null>(null);
  const [chartName, setChartName] = useState("");
  const [manualType, setManualType] = useState<ManualChartType | null>(null);

  const [datasetFields, setDatasetFields] = useState<DatasetField[]>([]);
  const [selectedType, setSelectedType] = useState<DatasetChartType | null>(null);
  const [selectedXField, setSelectedXField] = useState<string | null>(null);
  const [selectedYField, setSelectedYField] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);

  const kind = token ? parseChartKind(token) : null;

  useEffect(() => {
    if (!kind) {
      setNotFoundError(true);
      return;
    }

    const getChart = async () => {
      const fetchResult = await chartService.getByToken(token!);

      if (fetchResult.errorMessage) {
        if (!retried.current && fetchResult.statusCode === 401) {
          await handleUnauthorized(retried, navigate, getChart);
          return;
        }

        const errors: Record<number, () => void> = {
          403: () => setForbiddenError(true),
          404: () => setNotFoundError(true),
          500: () => setServerError(true),
          429: () => setTooManyRequestsError(true),
        };

        if (fetchResult.statusCode && fetchResult.statusCode in errors) {
          errors[fetchResult.statusCode]();
        } else {
          setNetworkError(true);
        }

        return;
      }

      setChartData(fetchResult.data.chartData);
      setChartName(fetchResult.data.chartName);
      setManualType(fetchResult.data.manualType ?? null);

      setDatasetFields(fetchResult.data.datasetFields ?? []);
      setSelectedType(fetchResult.data.selectedType ?? null);
      setSelectedXField(fetchResult.data.selectedXField ?? null);
      setSelectedYField(fetchResult.data.selectedYField ?? null);
      setTruncated(fetchResult.data.truncated ?? false);
      setDatasetInfo(fetchResult.data.datasetInfo ?? null);

      setVerified(true);
    };

    getChart();
  }, [token]);

  if (networkError) {
    return (
      <Error
        error="Something went wrong"
        secondaryMessage="A network error occurred while trying to verify the chart."
      />
    );
  }

  if (serverError) {
    return (
      <Error
        error="Server Error"
        secondaryMessage="Something happened on our side. We are already working on it."
      />
    );
  }

  if (tooManyRequestsError) {
    return (
      <Error
        error="Too Many Requests"
        secondaryMessage="You have made too many requests in a short period of time. Please try again later."
      />
    );
  }

  if (forbiddenError) {
    return (
      <Error
        error="Forbidden"
        secondaryMessage="You do not have permissions to access this chart."
      />
    );
  }

  if (notFoundError) {
    return (
      <Error
        error="Not Found"
        secondaryMessage="The chart you are looking for does not exist."
      />
    );
  }

  if (verified) {
    switch (kind) {
      case "ai":
        return <AIChart initialData={chartData} initialName={chartName} />;
      case "dataset":
        return (
          <DatasetChart
            initialName={chartName}
            initialData={chartData}
            initialFields={datasetFields}
            initialType={selectedType}
            initialXField={selectedXField}
            initialYField={selectedYField}
            initialTruncated={truncated}
            initialDatasetInfo={datasetInfo}
          />
        );
      case "manual":
        return (
          <ManualChart
            initialName={chartName}
            initialData={chartData}
            initialType={manualType ?? undefined}
          />
        );
    }
  }
};
