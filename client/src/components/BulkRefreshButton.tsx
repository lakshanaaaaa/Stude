import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BulkRefreshProgress {
  isRunning: boolean;
  department?: string;
  totalStudents: number;
  completedStudents: number;
  failedStudents: number;
  currentStudent?: string;
  errors: { username: string; error: string }[];
  startTime?: string;
}

export function BulkRefreshButton() {
  const [showDialog, setShowDialog] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const { toast } = useToast();

  // Start refresh mutation
  const startRefresh = useMutation({
    mutationFn: async () => {
      return await apiRequest<{ message: string; progress: BulkRefreshProgress }>(
        "POST",
        "/api/faculty/refresh-all"
      );
    },
    onSuccess: () => {
      setShowDialog(true);
      setIsPolling(true);
      toast({
        title: "Refresh Started",
        description: "Updating all students in your department...",
      });
    },
    onError: (error: Error) => {
      console.error("Failed to start refresh:", error);
      toast({
        title: "Failed to Start Refresh",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Poll progress
  const { data: progress, refetch: refetchProgress } = useQuery<BulkRefreshProgress>({
    queryKey: ["/api/faculty/refresh-progress"],
    enabled: isPolling,
    refetchInterval: isPolling ? 2000 : false, // Poll every 2 seconds
  });

  // Stop polling when refresh is complete
  useEffect(() => {
    if (progress && !progress.isRunning && isPolling) {
      setIsPolling(false);
      // Refetch one more time to get final state
      setTimeout(() => refetchProgress(), 500);
    }
  }, [progress, isPolling, refetchProgress]);

  // Cancel refresh mutation
  const cancelRefresh = useMutation({
    mutationFn: async () => {
      return await apiRequest<{ message: string }>(
        "POST",
        "/api/faculty/refresh-cancel"
      );
    },
    onSuccess: () => {
      setIsPolling(false);
    },
    onError: (error: Error) => {
      console.error("Failed to cancel refresh:", error);
    },
  });

  const handleStartRefresh = () => {
    console.log("Starting bulk refresh...");
    startRefresh.mutate();
  };

  const handleCancel = () => {
    cancelRefresh.mutate();
  };

  const handleClose = () => {
    setShowDialog(false);
    setIsPolling(false);
  };

  const progressPercentage = progress?.totalStudents
    ? Math.round(((progress.completedStudents + progress.failedStudents) / progress.totalStudents) * 100)
    : 0;

  const isComplete = progress && !progress.isRunning && (progress.completedStudents + progress.failedStudents) > 0;

  return (
    <>
      <Button
        onClick={handleStartRefresh}
        disabled={startRefresh.isPending || isPolling}
        variant="default"
        size="sm"
      >
        {startRefresh.isPending || isPolling ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Refreshing...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh All Stats
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isComplete ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Refresh Complete
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                  Refreshing Department Stats
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {progress?.department && `Updating all students in ${progress.department} department`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{progress?.totalStudents || 0}</p>
                <p className="text-xs text-muted-foreground">Total Students</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-2xl font-bold text-green-600">{progress?.completedStudents || 0}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-2xl font-bold text-red-600">{progress?.failedStudents || 0}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Progress</span>
                <span className="text-muted-foreground">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              {progress?.currentStudent && (
                <p className="text-xs text-muted-foreground">
                  Currently processing: <span className="font-medium">@{progress.currentStudent}</span>
                </p>
              )}
            </div>

            {/* Errors List */}
            {progress && progress.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">Errors ({progress.errors.length})</span>
                </div>
                <ScrollArea className="h-32 rounded-lg border bg-muted/30 p-3">
                  <div className="space-y-2">
                    {progress.errors.map((error, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <XCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="font-medium">@{error.username}</span>
                          <span className="text-muted-foreground ml-2">{error.error}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Status Message */}
            {isComplete && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-600">Refresh Completed!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Successfully updated {progress.completedStudents} students.
                  {progress.failedStudents > 0 && ` ${progress.failedStudents} students failed to update.`}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Leaderboards and analytics have been refreshed.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              {progress?.isRunning ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={cancelRefresh.isPending}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={handleClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
