import { Metadata } from 'next';
import { getDocumentById } from '@/actions/documents';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const p = await params;
    const documentResponse = await getDocumentById(p.id);

    if (documentResponse.error || !documentResponse.data) {
        return {
            title: 'Sign Document | GetSign.app',
        };
    }

    const { file_name } = documentResponse.data;

    return {
        title: `Sign "${file_name}" | GetSign.app`,
    };
}

export default function SignLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
