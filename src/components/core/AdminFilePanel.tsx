import React, { useEffect, useState } from 'react';
import { useFileRegistryService } from '@/services/fileRegistryService';
import { Button } from '@/components/buttons/Button';
import { Alert } from '@/components/feedback/Alert';

interface FileInfo {
  uploader: string;
  ipfsHash: string;
  fileName: string;
  timestamp: string;
  isValid: boolean;
  fileSize: string;
  feePaid: string;
  discountApplied: string;
  isVerified: boolean;
  verificationTimestamp: string;
}

const AdminFilePanel: React.FC = () => {
  const {
    getAllValidFiles,
    updateFileVerification,
    removeFile,
    blacklistAddress,
    unblacklistAddress,
  } = useFileRegistryService();

  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getAllValidFiles()
      .then((result: FileInfo[]) => {
        setFiles(result);
        setLoading(false);
      })
      .catch((e) => {
        setError('Failed to fetch files: ' + (e.message || e));
        setLoading(false);
      });
  }, [actionMsg]);

  const handleVerify = async (index: number, fileId: number, verify: boolean) => {
    setActionMsg(null);
    setLoading(true);
    try {
      await updateFileVerification(fileId, verify);
      setActionMsg(`File ${verify ? 'verified' : 'unverified'} successfully.`);
    } catch (e: unknown) {
      setError('Verification failed: ' + (e instanceof Error ? e.message : String(e)));
    }
    setLoading(false);
  };

  const handleRemove = async (fileId: number) => {
    setActionMsg(null);
    setLoading(true);
    try {
      await removeFile(fileId);
      setActionMsg('File removed successfully.');
    } catch (e: unknown) {
      setError('Remove failed: ' + (e instanceof Error ? e.message : String(e)));
    }
    setLoading(false);
  };

  const handleBlacklist = async (uploader: string, blacklist: boolean) => {
    setActionMsg(null);
    setLoading(true);
    try {
      if (blacklist) {
        await blacklistAddress(uploader);
        setActionMsg('User blacklisted.');
      } else {
        await unblacklistAddress(uploader);
        setActionMsg('User unblacklisted.');
      }
    } catch (e: unknown) {
      setError('Blacklist action failed: ' + (e instanceof Error ? e.message : String(e)));
    }
    setLoading(false);
  };

  return (
    <div className="bg-white/10 rounded-xl p-6 border border-white/20">
      <h2 className="text-2xl font-bold mb-4">Admin File Panel</h2>
      {error && <Alert variant="destructive">{error}</Alert>}
      {/* TODO: Add a green success alert variant to Alert component if needed */}
      {actionMsg && <Alert variant="default">{actionMsg}</Alert>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full text-sm text-left">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Uploader</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, idx) => (
              <tr key={file.ipfsHash} className={!file.isValid ? 'opacity-50' : ''}>
                <td>{file.fileName}</td>
                <td className="font-mono">{file.uploader}</td>
                <td>{file.isValid ? 'Active' : 'Removed'}</td>
                <td>{file.isVerified ? 'Yes' : 'No'}</td>
                <td className="space-x-2">
                  {file.isValid && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleVerify(idx, idx, !file.isVerified)}>
                        {file.isVerified ? 'Unverify' : 'Verify'}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRemove(idx)}>
                        Remove
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => handleBlacklist(file.uploader, true)}>
                    Blacklist
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleBlacklist(file.uploader, false)}>
                    Unblacklist
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminFilePanel; 