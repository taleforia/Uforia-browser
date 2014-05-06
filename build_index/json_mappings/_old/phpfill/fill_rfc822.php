﻿<?php
define ( 'MESSAGE_BATCH_PER_RUN', 100000 );
define ( 'DB_USERNAME', 'uforia' );
define ( 'DB_PASSWORD', 'uforia' );
define ( 'DB_HOST', 'localhost' );
define ( 'DB_NAME', 'uforia' );

// DO NOT EDIT ANYTHING BEYOND THIS LINE
// Create database connection.
$dbh = mysql_connect ( DB_HOST, DB_USERNAME, DB_PASSWORD ) or die ( "Unable to connect to MySQL." );
// Select database by name.
$selected = mysql_select_db ( DB_NAME, $dbh ) or die ( "Could not open the MySQL database." );

$startTime = microtime ( true );

// Count total messages in database.
$sql = "
        SELECT COUNT(`63c5e0bd853105c84a2184539eb245`.`hashid`) AS `message_count`
        FROM `63c5e0bd853105c84a2184539eb245`
";
$result = mysql_query ( $sql );
$sql_result = mysql_fetch_array ( $result );
$total_messages = $sql_result ['message_count'];
mysql_free_result ( $result );
unset ( $sql_result, $result, $sql );

$message_iterator = 0;
for($message_offset = 0; $message_offset < $total_messages; $message_offset += MESSAGE_BATCH_PER_RUN) {
        echo "############## \n";
        echo "OFFSET: " . $message_offset . "\n";
        echo "LIMIT: " . MESSAGE_BATCH_PER_RUN . "\n";

        $sql = "
            SELECT `hashid`, `Delivered_To`, `Original_Recipient`, `Received`, `Return_Path`, `Received_SPF`, `Authentication_Results`, `DKIM_Signature`, `DomainKey_Signature`, `Organization`, `MIME_Version`, `List_Unsubscribe`, `X_Received`, `X_Priority`, `X_MSMail_Priority`, `X_Mailer`, `X_MimeOLE`, `X_Notifications`, `X_Notification_ID`, `X_Sender_ID`, `X_Notification_Category`, `X_Notification_Type`, `X_UB`, `Precedence`, `Reply_To`, `Auto_Submitted`, `Message_ID`, `Date`, `Subject`, `From`, `To`, `Content_Type`, `Email_Content`
                FROM `63c5e0bd853105c84a2184539eb245`
                ORDER BY `hashid` ASC";
                //LIMIT " . ( int ) $message_offset . "," . ( int ) MESSAGE_BATCH_PER_RUN . "";
        $msc = microtime ( true );
        $result = mysql_query ( $sql ) or die ( "Error in query: $query. " . mysql_error () );
        $msc = microtime ( true ) - $msc;
        echo ($msc * 1000) . " milliseconds \n"; // in milliseconds

        $msc_while = microtime ( true );

        while ( $fetched_result = mysql_fetch_array ( $result, MYSQL_ASSOC ) ) {
                // Set message id
                $message_iterator ++;

                // Create data object
                $data_string = json_encode ( array (
                                "hashid" => $fetched_result ['hashid'],
                                "Delivered_To" => $fetched_result ['Delivered_To'],
                                "Original_Recipient" => $fetched_result ['Original_Recipient'],
                                "Received" => $fetched_result ['Received'],
                                "Return_Path" => $fetched_result ['Return_Path'],
                                "Received_SPF" => $fetched_result ['Received_SPF'],
                                "Authentication_Results" => $fetched_result ['Authentication_Results'],
                                "DKIM_Signature" => $fetched_result ['DKIM_Signature'],
                                "DomainKey_Signature" => $fetched_result ['DomainKey_Signature'],
                                "Organization" => $fetched_result ['Organization'],
                                "MIME_Version" => $fetched_result ['MIME_Version'],
                                "List_Unsubscribe" => $fetched_result ['List_Unsubscribe'],
                                "X_Received" => $fetched_result ['X_Received'],
                                "X_Priority" => $fetched_result ['X_Priority'],
                                "X_MSMail_Priority" => $fetched_result ['X_MSMail_Priority'],
                                "X_Mailer" => $fetched_result ['X_Mailer'],
                                "X_MimeOLE" => $fetched_result ['X_MimeOLE'],
                                "X_Notifications" => $fetched_result ['X_Notifications'],
                                "X_Notification_ID" => $fetched_result ['X_Notification_ID'],
                                "X_Sender_ID" => $fetched_result ['X_Sender_ID'],
                                "X_Notification_Category" => $fetched_result ['X_Notification_Category'],
                                "X_Notification_Type" => $fetched_result ['X_Notification_Type'],
                                "X_UB" => $fetched_result ['X_UB'],
                                "Precedence" => $fetched_result ['Precedence'],
                                "Reply_To" => $fetched_result ['Reply_To'],
                                "Auto_Submitted" => $fetched_result ['Auto_Submitted'],
                                "Message_ID" => $fetched_result ['Message_ID'],
                                "Date" => $fetched_result ['Date'],
                                "Subject" => $fetched_result ['Subject'],
                                "From" => $fetched_result ['From'],
                                "To" => $fetched_result ['To'],
                                "Content_Type" => $fetched_result ['Content_Type'],
                                "Email_Content" => $fetched_result ['Email_Content'],

                ) );

                $ch = curl_init ( 'http://localhost:9200/uforia/message_rfc822/' . $message_iterator );
                curl_setopt ( $ch, CURLOPT_CUSTOMREQUEST, "POST" );
                curl_setopt ( $ch, CURLOPT_POSTFIELDS, $data_string );
                curl_setopt ( $ch, CURLOPT_RETURNTRANSFER, true );
                curl_setopt ( $ch, CURLOPT_HTTPHEADER, array (
                                'Content-Type: application/json',
                                'Content-Length: ' . strlen ( $data_string )
                ) );
                $curl_result = curl_exec ( $ch );
                curl_close ( $ch );

                echo $message_iterator . "\n";
                echo $curl_result;
                echo "\n\n";
                //unset ( $ch, $curl_result, $data_string, $receivers, $sender, $sqlSender, $sqlReceiver );

                usleep ( 100 );
        }
        $msc_while = microtime ( true ) - $msc_while;
        echo "While takes: " . ($msc_while * 1000) . " milliseconds \n\n";
        mysql_free_result ( $result );
        unset ( $data, $result, $sql, $msc, $msc_while );

        usleep ( 5000000 );
}

echo "######################################################################### \n";
echo "TOTAL MESSAGES: " . $total_messages . "\n";
echo "DONE IN " . (microtime ( true ) - $startTime) . " SECONDS \n\n";
echo "#########################################################################";
mysql_close ( $dbh );
unset ( $startTime, $total_messages, $selected, $dbh );

?>
