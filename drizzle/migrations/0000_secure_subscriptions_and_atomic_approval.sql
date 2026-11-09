-- 1. Un utilisateur ne doit pas pouvoir modifier son propre abonnement (contournement du plan Gratuit).
-- On supprime les policies d'écriture self-service ; seule la lecture de sa propre ligne reste autorisée.
-- Le trigger handle_new_user (SECURITY DEFINER) continue de créer la ligne 'free' à l'inscription,
-- et l'edge function manage-subscription (service role) garde l'écriture.
DROP POLICY IF EXISTS subscriptions_insert ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_update ON public.subscriptions;

-- 2. Approbation atomique d'une demande d'abonnement : mise à jour de la demande
-- ET activation de l'abonnement dans une seule transaction, avec verrouillage de la ligne
-- et refus si la demande n'est plus en attente.
CREATE OR REPLACE FUNCTION public.approve_subscription_request(
  _admin_id uuid,
  _request_id uuid,
  _admin_notes text DEFAULT NULL,
  _months int DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _req public.subscription_requests%ROWTYPE;
  _existing public.subscriptions%ROWTYPE;
  _months_num int;
  _now timestamptz := now();
  _new_expiry timestamptz;
BEGIN
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO _req FROM public.subscription_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande introuvable' USING ERRCODE = 'P0002';
  END IF;
  IF _req.status <> 'pending' THEN
    RAISE EXCEPTION 'Demande déjà traitée (statut: %)', _req.status USING ERRCODE = 'P0003';
  END IF;

  _months_num := GREATEST(1, LEAST(24, COALESCE(_months, 1)));

  SELECT * INTO _existing FROM public.subscriptions WHERE user_id = _req.user_id;

  _new_expiry := _now + (_months_num * INTERVAL '30 days');
  IF _existing.id IS NOT NULL AND _existing.plan = 'pro' AND _existing.expires_at IS NOT NULL AND _existing.expires_at > _now THEN
    _new_expiry := _existing.expires_at + (_months_num * INTERVAL '30 days');
  END IF;

  UPDATE public.subscription_requests
     SET status = 'approved', admin_notes = _admin_notes
   WHERE id = _request_id;

  IF _existing.id IS NOT NULL THEN
    UPDATE public.subscriptions
       SET plan = 'pro', status = 'active', starts_at = _now, expires_at = _new_expiry,
           payment_reference = _req.payment_reference, payment_mode = _req.payment_mode, amount = _req.amount
     WHERE user_id = _req.user_id;
  ELSE
    INSERT INTO public.subscriptions (user_id, plan, status, starts_at, expires_at, payment_reference, payment_mode, amount)
    VALUES (_req.user_id, 'pro', 'active', _now, _new_expiry, _req.payment_reference, _req.payment_mode, _req.amount);
  END IF;

  RETURN jsonb_build_object('success', true, 'expires_at', _new_expiry);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.approve_subscription_request(uuid, uuid, text, int) TO service_role;