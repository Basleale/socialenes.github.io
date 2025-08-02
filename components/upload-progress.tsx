import { Progress } from "@/components/ui/progress"

interface UploadProgressProps {
  files: { name: string; progress: number }[]
  onComplete?: () => void
}

export function UploadProgress({ files, onComplete }: UploadProgressProps) {
  const totalProgress = files.reduce((sum, file) => sum + file.progress, 0) / files.length

  if (files.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 min-w-80 z-50">
      <h3 className="text-white font-medium mb-3">
        Uploading {files.length} file{files.length > 1 ? "s" : ""}
      </h3>

      <div className="space-y-2">
        {files.map((file, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300 truncate">{file.name}</span>
              <span className="text-gray-400">{Math.round(file.progress)}%</span>
            </div>
            <Progress value={file.progress} className="h-1" />
          </div>
        ))}
      </div>

      <div className="mt-3 pt-2 border-t border-gray-600">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-300">Total Progress</span>
          <span className="text-gray-400">{Math.round(totalProgress)}%</span>
        </div>
        <Progress value={totalProgress} className="h-2" />
      </div>
    </div>
  )
}
