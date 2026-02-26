import { useState, useRef } from "react";
import { Upload, CheckCircle2, AlertCircle, FileText, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Alert, AlertDescription } from "../components/ui/alert";
import { toast } from "sonner";

interface CSVRow {
  id: string;
  latitude: string;
  longitude: string;
  timestamp: string;
  subtotal: string;
}

export function ImportCSV() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      processFile(droppedFile);
    } else {
      toast.error("Please drop a valid CSV file");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (file: File) => {
    setFile(file);
    setSuccess(false);
    setErrors([]);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());
      const headers = lines[0].split(",").map((h) => h.trim());

      // Validate headers
      const requiredHeaders = ["id", "latitude", "longitude", "timestamp", "subtotal"];
      const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        setErrors([`Missing required columns: ${missingHeaders.join(", ")}`]);
        setFile(null);
        return;
      }

      // Parse first 5 rows for preview
      const previewRows: CSVRow[] = [];
      for (let i = 1; i < Math.min(6, lines.length); i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        previewRows.push(row);
      }

      setPreview(previewRows);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setErrors([]);

    // Simulate import process
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());
      const totalRows = lines.length - 1; // Exclude header

      // Simulate processing with progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setProgress(i);
      }

      // Simulate some validation errors (random)
      const errorList: string[] = [];
      const errorCount = Math.floor(Math.random() * 3);
      for (let i = 0; i < errorCount; i++) {
        const rowNum = Math.floor(Math.random() * totalRows) + 2;
        errorList.push(`Row ${rowNum}: Invalid coordinate format`);
      }

      setErrors(errorList);
      setImportedCount(totalRows - errorCount);
      setSuccess(true);
      setImporting(false);
      setProgress(100);

      if (errorCount === 0) {
        toast.success(`Successfully imported ${totalRows} orders`);
      } else {
        toast.warning(`Imported ${totalRows - errorCount} orders with ${errorCount} errors`);
      }
    };
    reader.readAsText(file);
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    setSuccess(false);
    setErrors([]);
    setProgress(0);
    setImportedCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="mb-2">Import CSV</h1>
        <p className="text-muted-foreground">
          Upload a CSV file to bulk import drone delivery orders
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
        </CardHeader>
        <CardContent>
          {!file && !success && (
            <>
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/20 hover:bg-muted/40"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg mb-2">Drop your CSV file here or browse</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Maximum file size: 10MB
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-primary hover:bg-primary/90"
                >
                  Browse Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Required Columns
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li><span className="font-mono">id</span> - Unique order identifier</li>
                  <li><span className="font-mono">latitude</span> - Delivery latitude coordinate</li>
                  <li><span className="font-mono">longitude</span> - Delivery longitude coordinate</li>
                  <li><span className="font-mono">timestamp</span> - ISO 8601 date/time</li>
                  <li><span className="font-mono">subtotal</span> - Order amount before tax</li>
                </ul>
              </div>
            </>
          )}

          {file && !success && (
            <>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={reset}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {errors.length > 0 && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="font-medium mb-1">Validation Errors:</div>
                    <ul className="list-disc ml-4 text-sm">
                      {errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {preview.length > 0 && errors.length === 0 && (
                <>
                  <h4 className="font-medium mb-3">Preview (First 5 rows)</h4>
                  <div className="border border-border rounded-lg overflow-hidden mb-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left py-2 px-3 font-medium">ID</th>
                            <th className="text-left py-2 px-3 font-medium">Latitude</th>
                            <th className="text-left py-2 px-3 font-medium">Longitude</th>
                            <th className="text-left py-2 px-3 font-medium">Timestamp</th>
                            <th className="text-left py-2 px-3 font-medium">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.map((row, i) => (
                            <tr key={i} className="border-t border-border">
                              <td className="py-2 px-3 font-mono text-xs">{row.id}</td>
                              <td className="py-2 px-3 font-mono text-xs">{row.latitude}</td>
                              <td className="py-2 px-3 font-mono text-xs">{row.longitude}</td>
                              <td className="py-2 px-3 text-xs">{row.timestamp}</td>
                              <td className="py-2 px-3">${row.subtotal}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {importing && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Importing orders...</span>
                        <span className="text-sm font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  <Button
                    onClick={handleImport}
                    disabled={importing || errors.length > 0}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {importing ? "Importing..." : `Import ${preview.length}+ Orders`}
                  </Button>
                </>
              )}
            </>
          )}

          {success && (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-[#22C55E] mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Import Successful!</h3>
              <p className="text-muted-foreground mb-6">
                Successfully imported <span className="font-bold text-[#22C55E]">{importedCount.toLocaleString()}</span> orders
              </p>

              {errors.length > 0 && (
                <Alert className="mb-6 border-orange-200 bg-orange-50 text-left">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <div className="font-medium mb-1">{errors.length} row(s) failed:</div>
                    <ul className="list-disc ml-4 text-sm">
                      {errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 justify-center">
                <Button onClick={reset} variant="outline">
                  Import Another File
                </Button>
                <Button onClick={() => window.location.href = "/orders"} className="bg-primary hover:bg-primary/90">
                  View Orders
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
