import { Box, Link, styled, Typography } from '@mui/material';
import { File } from '@aas-core-works/aas-core3.0-typescript/types';
import { messages } from 'lib/i18n/localization';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { getSanitizedHref } from 'lib/util/HrefUtil';
import { isValidUrl } from 'lib/util/UrlUtil';
import { useAsyncEffect } from 'lib/hooks/UseAsyncEffect';
import { getAttachmentFromSubmodelElement } from 'lib/services/repository-access/repositorySearchActions';
import { base64ToBlob } from 'lib/util/Base64Util';
import { isSuccessWithFile } from 'lib/util/apiResponseWrapper/apiResponseWrapperUtil';
import { useAasOriginSourceState } from 'components/contexts/CurrentAasContext';

const StyledFileImg = styled('img')(() => ({
    objectFit: 'contain',
    objectPosition: 'left top',
    maxWidth: '100%',
    maxHeight: '300px',
}));

type FileComponentProps = {
    readonly file: File;
    readonly submodelId?: string;
    readonly submodelElementPath?: string;
};

export function FileComponent(props: FileComponentProps) {
    const [image, setImage] = useState<string | null>(null);
    const { file } = props;
    const [aasOriginUrl] = useAasOriginSourceState();

    async function getImage() {
        if (file.contentType?.startsWith('image')) {
            if (isValidUrl(file.value)) {
                setImage(file.value);
            } else if (props.submodelId && props.submodelElementPath) {
                const imageResponse = await getAttachmentFromSubmodelElement(
                    props.submodelId,
                    props.submodelElementPath,
                    aasOriginUrl,
                );
                if (!imageResponse.isSuccess) {
                    console.error('Image not found' + imageResponse.message);
                } else if (isSuccessWithFile(imageResponse)) {
                    const imageObjectURL = URL.createObjectURL(
                        base64ToBlob(imageResponse.result, imageResponse.fileType),
                    );
                    setImage(imageObjectURL);
                }
            }
        }
    }

    useAsyncEffect(async () => {
        await getImage();
    }, []);

    if (!file) {
        return <></>;
    }

    if (image) {
        return (
            <Box>
                <StyledFileImg src={image} />
            </Box>
        );
    } else {
        return file.value ? (
            <Link href={getSanitizedHref(file.value?.toString())} target="_blank">
                <Typography>{file.value?.toString()}</Typography>
            </Link>
        ) : (
            <Typography>
                <FormattedMessage {...messages.mnestix.notAvailable} />
            </Typography>
        );
    }
}
