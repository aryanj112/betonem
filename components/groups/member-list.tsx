import { Avatar } from "@/components/common/avatar";

interface Member {
  id: string;
  display_name: string;
  username: string;
  avatar_url?: string | null;
  balance: number;
  is_creator?: boolean;
}

interface MemberListProps {
  members: Member[];
  currentUserId: string;
}

export function MemberList({ members, currentUserId }: MemberListProps) {
  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-3 bg-white rounded-lg border"
        >
          <div className="flex items-center gap-3">
            <Avatar
              src={member.avatar_url}
              alt={member.display_name}
              fallback={member.display_name}
              size="md"
            />
            <div>
              <p className="font-medium text-gray-900">
                {member.display_name}
                {member.id === currentUserId && (
                  <span className="text-xs text-gray-500 ml-2">(You)</span>
                )}
                {member.is_creator && (
                  <span className="text-xs text-primary ml-2">• Creator</span>
                )}
              </p>
              <p className="text-sm text-gray-500">@{member.username}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900">{member.balance}</p>
            <p className="text-xs text-gray-500">coins</p>
          </div>
        </div>
      ))}
    </div>
  );
}

