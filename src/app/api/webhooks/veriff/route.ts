import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyWebhookSignature, getVeriffDecision, mapVeriffDocument } from '@/lib/veriff';

// POST /api/webhooks/veriff — Handle Veriff verification results
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-hmac-signature') || '';

    // Verify webhook authenticity
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid Veriff webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const { id: sessionId, action, feature, vendorData } = payload;

    // Only process decision events
    if (action !== 'decision') {
      return NextResponse.json({ status: 'ignored' });
    }

    // Get full decision details
    const decision = await getVeriffDecision(sessionId);

    // Find user by veriff session ID
    const user = await prisma.user.findFirst({
      where: { veriffSessionId: sessionId },
    });

    if (!user) {
      console.error(`No user found for Veriff session: ${sessionId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (decision.status === 'approved') {
      // Determine what was verified
      const docVerification = decision.document
        ? mapVeriffDocument(decision.document.type)
        : { idVerified: true, licenseVerified: false };

      await prisma.user.update({
        where: { id: user.id },
        data: {
          idVerified: docVerification.idVerified,
          licenseVerified: docVerification.licenseVerified,
          selfieVerified: true, // Veriff always does liveness + face match
          verificationStatus: 'approved',
          verifiedAt: new Date(),
        },
      });

      // Notify user of successful verification
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'VERIFICATION',
          title: 'Vérification réussie / Verification approved',
          message: docVerification.licenseVerified
            ? 'Votre identité et permis de conduire ont été vérifiés. / Your identity and driver\'s license have been verified.'
            : 'Votre identité a été vérifiée. Veuillez aussi vérifier votre permis de conduire pour conduire. / Your identity has been verified. Please also verify your driver\'s license to drive.',
        },
      });
    } else if (decision.status === 'resubmission_requested') {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationStatus: 'resubmission',
          veriffSessionId: null, // Allow new session
        },
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'VERIFICATION',
          title: 'Vérification à refaire / Verification resubmission needed',
          message: `Raison / Reason: ${decision.reason || 'Document unclear'}. Veuillez réessayer. / Please try again.`,
        },
      });
    } else if (decision.status === 'declined') {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationStatus: 'declined',
          veriffSessionId: null,
        },
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'VERIFICATION',
          title: 'Vérification refusée / Verification declined',
          message: 'Contactez le support pour plus d\'informations. / Contact support for more information.',
        },
      });
    }

    return NextResponse.json({ status: 'processed' });
  } catch (error: unknown) {
    console.error('Veriff webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
