import { useCallback, useMemo, useState } from "react";
import { LoginInfo } from "../../models/LoginInfo";

export const useNeedsManualApproval = (info: LoginInfo) => {
  const [approvedHosts, setApprovedHosts] = useState<Set<string>>(
    new Set([window.location.host])
  );

  const needsManualApproval = useMemo(() => {
    const jwtUrl = new URL(info.jwtEndpoint);
    const hasBeenApproved = approvedHosts.has(jwtUrl.host);
    console.log(jwtUrl, approvedHosts, hasBeenApproved);
    return !hasBeenApproved;
  }, [info, approvedHosts]);

  const onApprovalReceived = useCallback(() => {
    console.log("approval received");
    setApprovedHosts(
      new Set([new URL(info.jwtEndpoint).host, ...approvedHosts])
    );
  }, [info, approvedHosts]);

  return { needsManualApproval, onApprovalReceived };
};
