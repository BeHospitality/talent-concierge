-- Add organization_id to team_members
ALTER TABLE public.team_members
ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

-- Index for faster lookups
CREATE INDEX idx_team_members_organization_id ON public.team_members(organization_id);